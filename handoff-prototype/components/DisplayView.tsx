"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DebugOverlay, fmt } from "./DebugOverlay";
import { HandoffObject } from "./HandoffObject";
import { PairingPanel } from "./PairingPanel";
import { StatusLine } from "./StatusLine";
import { OBJECT_ID, type HandoffEvent, type ObjectHandoffEvent, type TransportKind } from "@/lib/handoff/types";
import { useRoomSession } from "@/lib/handoff/useRoomSession";
import { useThrowable, type ReleaseInfo } from "@/lib/handoff/useThrowable";

const ACTION_HIDE_MS = 4000;

export function DisplayView({ room, debug, prefer }: { room: string; debug: boolean; prefer?: TransportKind }) {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [lastEvent, setLastEvent] = useState<{ event: HandoffEvent; latency: number } | null>(null);
  const [lastHandoff, setLastHandoff] = useState<{ event: ObjectHandoffEvent; latency: number } | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [justConnected, setJustConnected] = useState(false);
  const peerConnected = useRef(false);

  const object = useThrowable({
    exitEdge: "bottom",
    initiallyPresent: false,
    canThrow: () => peerConnected.current,
    onRelease: setRelease,
    onTap: () => setActionOpen((open) => !open),
    onThrow: (info) => {
      setActionOpen(false);
      const sent = session.send({
        type: "object_handoff",
        objectId: OBJECT_ID,
        source: "display",
        destination: "controller",
        ...info,
      });
      if (sent) setLastEvent({ event: sent, latency: 0 });
    },
  });
  const { enter, throwOut } = object;
  const holding = !["away", "exiting"].includes(object.phase);

  const onEvent = useCallback(
    (event: HandoffEvent, latency: number) => {
      if (event.type === "object_handoff" && event.destination === "display") {
        enter(event, latency, "bottom");
        setLastHandoff({ event, latency });
      }
      if (event.type === "object_recall") throwOut();
      if (event.type !== "presence") setLastEvent({ event, latency });
    },
    [enter, throwOut],
  );

  const session = useRoomSession({ room, role: "display", holding, prefer, onEvent });
  const connected = session.peer.connected;
  peerConnected.current = connected;

  // Brief "Controller connected" acknowledgement, then get out of the way.
  useEffect(() => {
    if (!connected) return;
    setJustConnected(true);
    const t = setTimeout(() => setJustConnected(false), 2200);
    return () => clearTimeout(t);
  }, [connected]);

  // The return action is a transient affordance.
  useEffect(() => {
    if (!actionOpen) return;
    const t = setTimeout(() => setActionOpen(false), ACTION_HIDE_MS);
    return () => clearTimeout(t);
  }, [actionOpen]);
  useEffect(() => {
    if (object.phase !== "present" && object.phase !== "settling") setActionOpen(false);
  }, [object.phase]);

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

  const pairing = !connected && !holding && object.phase === "away";
  const idleText = justConnected ? "Controller connected" : "Waiting for object";

  return (
    <main className="stage stage-display" onPointerDown={(e) => e.target === e.currentTarget && setActionOpen(false)}>
      <div className="horizon" aria-hidden />

      <header className="chrome-top" data-hidden={pairing}>
        {session.status === "open" ? (
          connected ? (
            <StatusLine tone="ok" text="Connected" />
          ) : (
            <StatusLine tone="wait" text={`Controller offline · ${room}`} fadeWhenOk={false} />
          )
        ) : (
          <StatusLine tone={session.status === "error" ? "bad" : "wait"} text={session.status === "error" ? "Connection error" : "Connecting"} />
        )}
      </header>

      <PairingPanel room={room} show={pairing} />

      <p className="idle-note" data-show={!pairing && object.phase === "away"}>
        {idleText}
      </p>

      <HandoffObject ref={object.ref} phase={object.phase} {...object.handlers} />

      <div className="return-action" data-show={actionOpen}>
        <button type="button" className="ghost-button" onClick={() => throwOut()} disabled={!connected}>
          Return to tablet
        </button>
      </div>

      {debug && (
        <DebugOverlay
          rows={{
            room,
            role: "display",
            transport: `${session.kind ?? "…"} · ${session.status}`,
            peer: connected ? `controller${session.peer.holding ? " (holding)" : ""}` : "none",
            phase: object.phase,
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
