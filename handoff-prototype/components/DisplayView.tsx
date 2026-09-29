"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebugOverlay, fmt } from "./DebugOverlay";
import { DetailView, type CloseReason, type DetailHandle } from "./DetailView";
import { PairingPanel } from "./PairingPanel";
import { StatusLine } from "./StatusLine";
import { preloadObjects, ThrowableObject, type ThrowableHandle } from "./ThrowableObject";
import { isKnownObject, OBJECTS } from "@/lib/handoff/objects";
import type { HandoffEvent, ObjectHandoffEvent, TransportKind } from "@/lib/handoff/types";
import { useRoomSession } from "@/lib/handoff/useRoomSession";
import { useSlots } from "@/lib/handoff/useSlots";
import type { ObjectPhase, ReleaseInfo, ThrowInfo } from "@/lib/handoff/useThrowable";

const isHeld = (phase: ObjectPhase | undefined) => phase !== undefined && phase !== "away" && phase !== "exiting";

export function DisplayView({ room, debug, prefer }: { room: string; debug: boolean; prefer?: TransportKind }) {
  preloadObjects(OBJECTS);
  const slots = useSlots(OBJECTS.length, "display");
  const [phases, setPhases] = useState<Record<string, ObjectPhase>>({});
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [lastEvent, setLastEvent] = useState<{ event: HandoffEvent; latency: number } | null>(null);
  const [lastHandoff, setLastHandoff] = useState<{ event: ObjectHandoffEvent; latency: number } | null>(null);
  /** Object open in the detail view. */
  const [detail, setDetail] = useState<string | null>(null);
  const detailRef = useRef<DetailHandle>(null);
  const detailId = useRef<string | null>(null);
  detailId.current = detail;
  const [justConnected, setJustConnected] = useState(false);
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
      // Called back while being inspected: zoom back into the slot, then send it.
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
  const onTap = useCallback((id: string) => setDetail(id), []);
  const onDetailClosed = useCallback(
    (reason: CloseReason) => {
      const id = detail;
      setDetail(null);
      if (reason === "action" && id) handles.current[id]?.throwOut();
    },
    [detail],
  );
  const canThrow = useCallback(() => peerConnected.current, []);

  // Brief "Controller connected" acknowledgement, then get out of the way.
  useEffect(() => {
    if (!connected) return;
    setJustConnected(true);
    const t = setTimeout(() => setJustConnected(false), 2200);
    return () => clearTimeout(t);
  }, [connected]);

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
      if (!(e.target as HTMLElement).closest(".object, button")) toggle();
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
  const idleText = justConnected ? "Controller connected" : "Waiting for objects";
  const detailIndex = detail ? OBJECTS.findIndex((o) => o.id === detail) : -1;

  return (
    <main className="stage stage-display">
      <div className="horizon" aria-hidden />

      <header className="chrome-top" data-hidden={pairing}>
        {session.status === "open" ? (
          connected ? (
            <StatusLine tone="ok" text="Connected" />
          ) : (
            <StatusLine tone="wait" text={`Controller offline · ${room}`} fadeWhenOk={false} />
          )
        ) : (
          <StatusLine
            tone={session.status === "error" ? "bad" : "wait"}
            text={session.status === "error" ? "Connection error" : "Connecting"}
          />
        )}
      </header>

      <PairingPanel room={room} show={pairing} />

      <p className="idle-note" data-show={!pairing && empty}>
        {idleText}
      </p>

      {slots &&
        OBJECTS.map((o, i) => (
          <ThrowableObject
            key={o.id}
            ref={(h) => {
              handles.current[o.id] = h;
            }}
            spec={o}
            slot={slots[i]}
            exitEdge="bottom"
            initiallyPresent={false}
            canThrow={canThrow}
            onThrow={onThrow}
            onTap={onTap}
            onRelease={setRelease}
            onPhase={onPhase}
            focused={detail === o.id}
          />
        ))}

      {slots && detailIndex >= 0 && (
        <DetailView
          key={detail}
          ref={detailRef}
          spec={OBJECTS[detailIndex]}
          from={slots[detailIndex]}
          actionLabel="Return to tablet"
          actionDisabled={!connected}
          onClosed={onDetailClosed}
        />
      )}

      {debug && (
        <DebugOverlay
          rows={{
            room,
            role: "display",
            transport: `${session.kind ?? "…"} · ${session.status}`,
            peer: connected ? `controller (${session.peer.held.length} held)` : "none",
            "on this screen": held.length,
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
