"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebugOverlay, fmt } from "./DebugOverlay";
import { StatusLine } from "./StatusLine";
import { preloadObjects, ThrowableObject, type ThrowableHandle } from "./ThrowableObject";
import { isKnownObject, OBJECTS } from "@/lib/handoff/objects";
import type { HandoffEvent, TransportKind } from "@/lib/handoff/types";
import { useRoomSession } from "@/lib/handoff/useRoomSession";
import { useSlots } from "@/lib/handoff/useSlots";
import type { ObjectPhase, ReleaseInfo, ThrowInfo } from "@/lib/handoff/useThrowable";

/** If the display says it isn't holding an object this long after we threw it, take it back. */
const LOST_OBJECT_MS = 3000;

const isHeld = (phase: ObjectPhase | undefined) => phase !== undefined && phase !== "away" && phase !== "exiting";

export function ControllerView({ room, debug, prefer }: { room: string; debug: boolean; prefer?: TransportKind }) {
  preloadObjects(OBJECTS);
  const slots = useSlots(OBJECTS.length, "controller");
  const [phases, setPhases] = useState<Record<string, ObjectPhase>>({});
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [lastEvent, setLastEvent] = useState<{ event: HandoffEvent; latency: number } | null>(null);
  const [thrownOnce, setThrownOnce] = useState(false);
  const handles = useRef<Record<string, ThrowableHandle | null>>({});
  const lastSentAt = useRef<Record<string, number>>({});
  const peerConnected = useRef(false);

  const onPhase = useCallback((id: string, phase: ObjectPhase) => {
    setPhases((p) => (p[id] === phase ? p : { ...p, [id]: phase }));
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

  const retrieve = (id: string) => session.send({ type: "object_recall", objectId: id, source: "controller" });

  const status =
    session.status === "error"
      ? { tone: "bad" as const, text: "Connection error" }
      : session.status !== "open"
        ? { tone: "wait" as const, text: "Connecting" }
        : !session.peer.connected
          ? { tone: "wait" as const, text: "Waiting for display" }
          : { tone: "ok" as const, text: "Display ready" };

  const canThrow = useCallback(() => peerConnected.current, []);
  const anyPresent = OBJECTS.some((o) => (phases[o.id] ?? "present") === "present");

  return (
    <main className="stage stage-controller">
      <header className="chrome-top">
        <StatusLine tone={status.tone} text={status.text} />
        <span className="room-tag">{room}</span>
      </header>

      {slots &&
        OBJECTS.map((o, i) => (
          <button
            key={`ghost-${o.id}`}
            type="button"
            className="slot-ghost"
            data-show={phases[o.id] === "away"}
            style={{ left: slots[i].x - slots[i].w / 2, top: slots[i].y - slots[i].h / 2, width: slots[i].w, height: slots[i].h }}
            onClick={() => retrieve(o.id)}
            disabled={!session.peer.connected}
            aria-label={`Retrieve ${o.name}`}
          >
            <span>On display</span>
            <span className="slot-ghost-action">Tap to retrieve</span>
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
            slot={slots[i]}
            exitEdge="top"
            initiallyPresent
            canThrow={canThrow}
            onThrow={onThrow}
            onRelease={setRelease}
            onPhase={onPhase}
          />
        ))}

      <p className="hint" data-show={!thrownOnce && session.peer.connected && anyPresent}>
        Flick up to send
      </p>

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
