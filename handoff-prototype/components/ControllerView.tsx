"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebugOverlay, fmt } from "./DebugOverlay";
import { HandoffObject } from "./HandoffObject";
import { StatusLine } from "./StatusLine";
import { OBJECT_ID, type HandoffEvent, type TransportKind } from "@/lib/handoff/types";
import { useRoomSession } from "@/lib/handoff/useRoomSession";
import { useThrowable, type ReleaseInfo } from "@/lib/handoff/useThrowable";

/** If the display says it isn't holding the object for this long after we threw it, take it back. */
const LOST_OBJECT_MS = 3000;

export function ControllerView({ room, debug, prefer }: { room: string; debug: boolean; prefer?: TransportKind }) {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [lastEvent, setLastEvent] = useState<{ event: HandoffEvent; latency: number } | null>(null);
  const [thrownOnce, setThrownOnce] = useState(false);
  const lastSentAt = useRef(0);
  const peerConnected = useRef(false);

  const object = useThrowable({
    exitEdge: "top",
    initiallyPresent: true,
    canThrow: () => peerConnected.current,
    onRelease: setRelease,
    onThrow: (info) => {
      lastSentAt.current = Date.now();
      const sent = session.send({
        type: "object_handoff",
        objectId: OBJECT_ID,
        source: "controller",
        destination: "display",
        ...info,
      });
      if (sent) setLastEvent({ event: sent, latency: 0 });
      setThrownOnce(true);
    },
  });

  const { enter, place, phaseRef } = object;
  const holding = !["away", "exiting"].includes(object.phase);

  const onEvent = useCallback(
    (event: HandoffEvent, latency: number) => {
      if (event.type === "object_handoff" && event.destination === "controller") {
        enter(event, latency, "top");
      }
      if (event.type !== "presence") setLastEvent({ event, latency });
    },
    [enter],
  );

  const session = useRoomSession({ room, role: "controller", holding, prefer, onEvent });
  peerConnected.current = session.peer.connected;

  // Reconcile after reloads: exactly one screen should hold the object.
  useEffect(() => {
    const { connected, holding: displayHolds } = session.peer;
    if (!connected) return;
    const phase = phaseRef.current;
    if (displayHolds && phase === "present") place(false);
    if (!displayHolds && phase === "away" && Date.now() - lastSentAt.current > LOST_OBJECT_MS) {
      place(true);
    }
  }, [session.peer, place, phaseRef]);

  const retrieve = () => {
    session.send({ type: "object_recall", objectId: OBJECT_ID, source: "controller" });
  };

  const status =
    session.status === "error"
      ? { tone: "bad" as const, text: "Connection error" }
      : session.status !== "open"
        ? { tone: "wait" as const, text: "Connecting" }
        : !session.peer.connected
          ? { tone: "wait" as const, text: "Waiting for display" }
          : { tone: "ok" as const, text: "Display ready" };

  const away = object.phase === "away";

  return (
    <main className="stage stage-controller">
      <header className="chrome-top">
        <StatusLine tone={status.tone} text={status.text} />
        <span className="room-tag">{room}</span>
      </header>

      <HandoffObject ref={object.ref} phase={object.phase} {...object.handlers} />

      <div className="away-note" data-show={away}>
        <p>On display</p>
        <button type="button" className="ghost-button" onClick={retrieve} disabled={!session.peer.connected}>
          Retrieve
        </button>
      </div>

      <p className="hint" data-show={!thrownOnce && session.peer.connected && object.phase === "present"}>
        Flick up to send
      </p>

      {debug && (
        <DebugOverlay
          rows={{
            room,
            role: "controller",
            transport: `${session.kind ?? "…"} · ${session.status}`,
            peer: session.peer.connected ? `display${session.peer.holding ? " (holding)" : ""}` : "none",
            phase: object.phase,
            "release speed": release ? `${Math.round(release.speed)} px/s` : null,
            vector: fmt.vec(release?.direction),
            "throw": release ? (release.thrown ? "yes" : release.reason ?? "blocked (no display)") : null,
            latency: lastEvent && lastEvent.latency ? `${lastEvent.latency} ms` : null,
            "last event": fmt.time(lastEvent?.event.timestamp),
          }}
          payload={lastEvent?.event}
        />
      )}
    </main>
  );
}
