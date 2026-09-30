"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { DebugOverlay, fmt } from "./DebugOverlay";
import { MissionHeader, type Indicator } from "./mission/MissionHeader";
import { ModuleInspector, type CloseReason, type InspectorHandle } from "./mission/ModuleInspector";
import { ThrowableObject, type ThrowableHandle } from "./ThrowableObject";
import { isKnownObject, OBJECTS } from "@/lib/handoff/objects";
import type { HandoffEvent, TransportKind } from "@/lib/handoff/types";
import { useRoomSession } from "@/lib/handoff/useRoomSession";
import { useSlots } from "@/lib/handoff/useSlots";
import type { ObjectPhase, ReleaseInfo, ThrowInfo } from "@/lib/handoff/useThrowable";
import { MISSION } from "@/lib/mission/content";

/** If the display says it isn't holding an object this long after we threw it, take it back. */
const LOST_OBJECT_MS = 3000;

const isHeld = (phase: ObjectPhase | undefined) => phase !== undefined && phase !== "away" && phase !== "exiting";

/** The tablet: a portable operations terminal holding the four mission modules. */
export function ControllerView({ room, debug, prefer }: { room: string; debug: boolean; prefer?: TransportKind }) {
  const slots = useSlots(OBJECTS.length, "controller");
  const [phases, setPhases] = useState<Record<string, ObjectPhase>>({});
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [lastEvent, setLastEvent] = useState<{ event: HandoffEvent; latency: number } | null>(null);
  const [thrownOnce, setThrownOnce] = useState(false);
  /** Modules we asked the display to send back, until they start arriving. */
  const [retrieving, setRetrieving] = useState<Record<string, boolean>>({});
  /** Module open in the inspector. */
  const [detail, setDetail] = useState<string | null>(null);
  const detailRef = useRef<InspectorHandle>(null);
  const handles = useRef<Record<string, ThrowableHandle | null>>({});
  const lastSentAt = useRef<Record<string, number>>({});
  const peerConnected = useRef(false);

  const onPhase = useCallback((id: string, phase: ObjectPhase) => {
    setPhases((p) => (p[id] === phase ? p : { ...p, [id]: phase }));
    if (phase !== "away") setRetrieving((r) => (r[id] ? { ...r, [id]: false } : r));
  }, []);

  const onEvent = useCallback((event: HandoffEvent, latency: number) => {
    if (event.type === "object_handoff" && event.destination === "controller" && isKnownObject(event.objectId)) {
      handles.current[event.objectId]?.enter(event, latency, "top");
    }
    if (event.type !== "presence") setLastEvent({ event, latency });
  }, []);

  const held = OBJECTS.filter((o) => isHeld(phases[o.id] ?? "present")).map((o) => o.id);
  const session = useRoomSession({ room, role: "controller", held, prefer, onEvent });
  peerConnected.current = session.peer.connected;

  const onThrow = useCallback(
    (id: string, info: ThrowInfo) => {
      lastSentAt.current[id] = Date.now();
      const sent = session.send({ type: "object_handoff", objectId: id, source: "controller", destination: "display", ...info });
      if (sent) setLastEvent({ event: sent, latency: 0 });
      setThrownOnce(true);
    },
    [session.send],
  );

  // Reconcile after reloads: each object should be on exactly one screen.
  useEffect(() => {
    if (!session.peer.connected) return;
    const displayHas = new Set(session.peer.held);
    for (const o of OBJECTS) {
      const h = handles.current[o.id];
      if (!h) continue;
      const phase = h.phase();
      if (displayHas.has(o.id) && phase === "present") h.place(false);
      if (!displayHas.has(o.id) && phase === "away" && Date.now() - (lastSentAt.current[o.id] ?? 0) > LOST_OBJECT_MS) {
        h.place(true);
      }
    }
  }, [session.peer]);

  const retrieve = (id: string) => {
    const sent = session.send({ type: "object_recall", objectId: id, source: "controller" });
    if (sent) setRetrieving((r) => ({ ...r, [id]: true }));
  };

  const link: Indicator =
    session.status === "error"
      ? { tone: "bad", label: "LINK ERROR" }
      : session.status !== "open"
        ? { tone: "wait", label: "CONNECTING" }
        : !session.peer.connected
          ? { tone: "wait", label: "AWAITING COMMAND DISPLAY" }
          : { tone: "ok", label: "COMMAND DISPLAY LINKED" };

  const canThrow = useCallback(() => peerConnected.current, []);
  const onTap = useCallback((id: string) => setDetail(id), []);
  const onDetailClosed = useCallback(
    (reason: CloseReason) => {
      const id = detail;
      setDetail(null);
      if (reason === "action" && id) handles.current[id]?.throwOut();
    },
    [detail],
  );
  const detailSpec = detail ? OBJECTS.find((o) => o.id === detail) : undefined;
  const anyPresent = OBJECTS.some((o) => (phases[o.id] ?? "present") === "present");

  return (
    <main className="stage stage-controller">
      <MissionHeader role="controller" indicators={[link]} room={room} />

      {slots &&
        OBJECTS.map((o, i) => (
          <button
            key={`dock-${o.id}`}
            type="button"
            className="dock-slot"
            data-show={phases[o.id] === "away"}
            data-retrieving={retrieving[o.id] || undefined}
            style={
              {
                left: slots[i].x - slots[i].w / 2,
                top: slots[i].y - slots[i].h / 2,
                width: slots[i].w,
                height: slots[i].h,
                "--accent": o.accent,
              } as CSSProperties
            }
            onClick={() => retrieve(o.id)}
            disabled={!session.peer.connected}
            aria-label={`Retrieve ${o.name}`}
          >
            <span className="dock-num">MOD {o.number}</span>
            <span className="dock-name">{o.name}</span>
            <span className="dock-state">{retrieving[o.id] ? "RETRIEVING" : MISSION.dockTitle}</span>
            <span className="dock-action">{MISSION.dockAction}</span>
          </button>
        ))}

      {slots &&
        OBJECTS.map((o, i) => (
          <ThrowableObject
            key={o.id}
            ref={(h) => {
              handles.current[o.id] = h;
            }}
            spec={o}
            role="controller"
            slot={slots[i]}
            exitEdge="top"
            initiallyPresent
            canThrow={canThrow}
            onThrow={onThrow}
            onTap={onTap}
            onRelease={setRelease}
            onPhase={onPhase}
          />
        ))}

      <p className="hint" data-show={!thrownOnce && session.peer.connected && anyPresent && !detail}>
        <span className="hint-arrow" aria-hidden />
        {MISSION.hint}
      </p>

      {detailSpec && (
        <ModuleInspector
          key={detailSpec.id}
          ref={detailRef}
          spec={detailSpec}
          actionLabel="TRANSFER TO COMMAND DISPLAY"
          actionDisabled={!session.peer.connected}
          onClosed={onDetailClosed}
        />
      )}

      {debug && (
        <DebugOverlay
          rows={{
            room,
            role: "controller",
            transport: `${session.kind ?? "…"} · ${session.status}`,
            peer: session.peer.connected ? `display (${session.peer.held.length} held)` : "none",
            "on this screen": held.length,
            "release speed": release ? `${Math.round(release.speed)} px/s` : null,
            vector: fmt.vec(release?.direction),
            throw: release ? (release.thrown ? "yes" : (release.reason ?? "blocked (no display)")) : null,
            latency: lastEvent && lastEvent.latency ? `${lastEvent.latency} ms` : null,
            "last event": fmt.time(lastEvent?.event.timestamp),
          }}
          payload={lastEvent?.event}
        />
      )}
    </main>
  );
}
