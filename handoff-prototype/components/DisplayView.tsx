"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebugOverlay, fmt } from "./DebugOverlay";
import { Atmosphere } from "./fx/Atmosphere";
import { IdleReticle } from "./fx/IdleReticle";
import { Ticker } from "./fx/Ticker";
import { MissionHeader, type Indicator } from "./mission/MissionHeader";
import { ModuleInspector, type CloseReason, type InspectorHandle } from "./mission/ModuleInspector";
import { PairingPanel } from "./PairingPanel";
import { ThrowableObject, type ThrowableHandle } from "./ThrowableObject";
import { dockHeight, headerHeight } from "@/lib/handoff/layout";
import { isKnownObject, OBJECTS } from "@/lib/handoff/objects";
import type { HandoffEvent, ObjectHandoffEvent, TransportKind } from "@/lib/handoff/types";
import { useRoomSession } from "@/lib/handoff/useRoomSession";
import { useSlots } from "@/lib/handoff/useSlots";
import type { ObjectPhase, ReleaseInfo, ThrowInfo } from "@/lib/handoff/useThrowable";
import { MISSION } from "@/lib/mission/content";

const isHeld = (phase: ObjectPhase | undefined) => phase !== undefined && phase !== "away" && phase !== "exiting";

/**
 * The wall: the ship's command display. Modules land in dedicated slots; tapping
 * one expands it, and the rest shrink into a dock along the bottom edge.
 */
export function DisplayView({ room, debug, prefer }: { room: string; debug: boolean; prefer?: TransportKind }) {
  /** Module open in the inspector. */
  const [detail, setDetail] = useState<string | null>(null);
  const slots = useSlots(OBJECTS.length, "display", detail ? "dock" : "grid");
  const [phases, setPhases] = useState<Record<string, ObjectPhase>>({});
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [lastEvent, setLastEvent] = useState<{ event: HandoffEvent; latency: number } | null>(null);
  const [lastHandoff, setLastHandoff] = useState<{ event: ObjectHandoffEvent; latency: number } | null>(null);
  const detailRef = useRef<InspectorHandle>(null);
  const detailId = useRef<string | null>(null);
  detailId.current = detail;
  const handles = useRef<Record<string, ThrowableHandle | null>>({});
  const peerConnected = useRef(false);

  const onPhase = useCallback((id: string, phase: ObjectPhase) => {
    setPhases((p) => (p[id] === phase ? p : { ...p, [id]: phase }));
  }, []);

  const onEvent = useCallback((event: HandoffEvent, latency: number) => {
    if (event.type === "object_handoff" && event.destination === "display" && isKnownObject(event.objectId)) {
      handles.current[event.objectId]?.enter(event, latency, "bottom");
      setLastHandoff({ event, latency });
    }
    if (event.type === "object_recall" && isKnownObject(event.objectId)) {
      // Called back while being inspected: close the inspector, then send it.
      if (detailId.current === event.objectId) detailRef.current?.close("action");
      else handles.current[event.objectId]?.throwOut();
    }
    if (event.type !== "presence") setLastEvent({ event, latency });
  }, []);

  const held = OBJECTS.filter((o) => isHeld(phases[o.id])).map((o) => o.id);
  const session = useRoomSession({ room, role: "display", held, prefer, onEvent });
  const connected = session.peer.connected;
  peerConnected.current = connected;

  const onThrow = useCallback(
    (id: string, info: ThrowInfo) => {
      const sent = session.send({ type: "object_handoff", objectId: id, source: "display", destination: "controller", ...info });
      if (sent) setLastEvent({ event: sent, latency: 0 });
    },
    [session.send],
  );

  // Tap a module to expand it; tap the expanded one (in the dock) again to collapse.
  const onTap = useCallback((id: string) => {
    if (detailId.current === id) detailRef.current?.close();
    else setDetail(id);
  }, []);
  const onDetailClosed = useCallback(
    (reason: CloseReason) => {
      const id = detail;
      setDetail(null);
      if (reason === "action" && id) handles.current[id]?.throwOut();
    },
    [detail],
  );
  const canThrow = useCallback(() => peerConnected.current, []);

  // If the inspected module leaves (flicked down from the dock), drop the inspector.
  useEffect(() => {
    if (detail && !isHeld(phases[detail])) setDetail(null);
  }, [detail, phases]);

  // Fullscreen with F or a double click on empty space: no browser chrome on the TV.
  useEffect(() => {
    const toggle = () => {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen?.().catch(() => {});
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") toggle();
    };
    const onDbl = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".object, button, .inspector")) toggle();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("dblclick", onDbl);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("dblclick", onDbl);
    };
  }, []);

  const empty = held.length === 0;
  const pairing = !connected && empty;
  const detailSpec = detail ? OBJECTS.find((o) => o.id === detail) : undefined;
  const vp = slots ? { w: window.innerWidth, h: window.innerHeight } : null;

  const indicators: Indicator[] = [
    session.status === "open"
      ? { tone: "ok", label: "SYSTEM ONLINE" }
      : { tone: session.status === "error" ? "bad" : "wait", label: session.status === "error" ? "LINK ERROR" : "CONNECTING" },
    connected ? { tone: "ok", label: "CONTROLLER CONNECTED" } : { tone: "wait", label: "CONTROLLER OFFLINE" },
    { tone: held.length ? "ok" : "wait", label: `ACTIVE MODULES ${held.length}/${OBJECTS.length}` },
  ];

  return (
    <main className="stage stage-display" data-inspecting={Boolean(detail)}>
      <Atmosphere role="display" />
      <div className="wall-grid" aria-hidden />
      <MissionHeader role="display" indicators={indicators} room={connected ? undefined : room} />

      <PairingPanel room={room} show={pairing} />

      <IdleReticle show={!pairing && empty} />
      <p className="idle-note" data-show={!pairing && empty}>
        {MISSION.emptyWall}
      </p>

      {detailSpec && vp && (
        <ModuleInspector
          key={detailSpec.id}
          ref={detailRef}
          spec={detailSpec}
          region={{ top: headerHeight(vp, "display"), bottom: dockHeight(vp) }}
          actionLabel="RETURN TO TABLET"
          actionDisabled={!connected}
          onClosed={onDetailClosed}
        />
      )}

      {slots &&
        OBJECTS.map((o, i) => (
          <ThrowableObject
            key={o.id}
            ref={(h) => {
              handles.current[o.id] = h;
            }}
            spec={o}
            role="display"
            slot={slots[i]}
            exitEdge="bottom"
            initiallyPresent={false}
            canThrow={canThrow}
            onThrow={onThrow}
            onTap={onTap}
            onRelease={setRelease}
            onPhase={onPhase}
            selected={detail === o.id}
          />
        ))}

      <Ticker
        show={!detail}
        items={[
          `${MISSION.wallTitle} MISSION ARCHIVE`,
          `LINK ${session.status === "open" ? "NOMINAL" : session.status.toUpperCase()}`,
          `CONTROLLER ${connected ? "CONNECTED" : "OFFLINE"}`,
          `ROOM ${room}`,
          ...OBJECTS.map((o) => `MOD ${o.number} ${o.name} ${held.includes(o.id) ? "ACTIVE" : "STANDBY"}`),
          `TRANSPORT ${(session.kind ?? "…").toUpperCase()}`,
        ]}
      />

      {debug && (
        <DebugOverlay
          rows={{
            room,
            role: "display",
            transport: `${session.kind ?? "…"} · ${session.status}`,
            peer: connected ? `controller (${session.peer.held.length} held)` : "none",
            "on this screen": held.length,
            inspecting: detail,
            "incoming object": lastHandoff?.event.objectId,
            "incoming speed": lastHandoff ? `${lastHandoff.event.velocity} px/s` : null,
            "incoming vector": fmt.vec(lastHandoff?.event.direction),
            "edge x": lastHandoff ? lastHandoff.event.edgeX.toFixed(2) : null,
            latency: lastHandoff ? `${lastHandoff.latency} ms` : null,
            "local release": release ? `${Math.round(release.speed)} px/s ${fmt.vec(release.direction)}` : null,
            "last event": fmt.time(lastEvent?.event.timestamp),
          }}
          payload={lastEvent?.event}
        />
      )}
    </main>
  );
}
