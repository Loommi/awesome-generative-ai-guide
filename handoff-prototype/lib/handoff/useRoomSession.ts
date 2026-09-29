"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createTransport, type Transport } from "./transport";
import type {
  DeviceRole,
  HandoffEvent,
  OutgoingEvent,
  TransportKind,
  TransportStatus,
} from "./types";

const HEARTBEAT_MS = 2000;
const PEER_TIMEOUT_MS = 6500;

export interface PeerState {
  connected: boolean;
  holding: boolean;
}

export interface RoomSession {
  room: string;
  role: DeviceRole;
  status: TransportStatus;
  kind: TransportKind | null;
  peer: PeerState;
  send: (event: OutgoingEvent) => HandoffEvent | null;
  /** One-way latency estimate (ms) for an event stamped with the sender's Date.now(). */
  latencyOf: (timestamp: number) => number;
}

const randomId = () => Math.random().toString(36).slice(2, 10);

/**
 * Joins a room over the configured transport, keeps presence with the peer
 * device and forwards handoff events. UI code never touches the transport.
 */
export function useRoomSession(opts: {
  room: string;
  role: DeviceRole;
  /** Whether this device currently holds the object (shared in presence). */
  holding: boolean;
  prefer?: TransportKind;
  onEvent: (event: HandoffEvent, latency: number) => void;
}): RoomSession {
  const { room, role, prefer } = opts;
  const clientId = useMemo(randomId, []);
  const [status, setStatus] = useState<TransportStatus>("connecting");
  const [kind, setKind] = useState<TransportKind | null>(null);
  const [peer, setPeer] = useState<PeerState>({ connected: false, holding: false });

  const transport = useRef<Transport | null>(null);
  const holding = useRef(opts.holding);
  holding.current = opts.holding;
  const onEvent = useRef(opts.onEvent);
  onEvent.current = opts.onEvent;
  const peerSeen = useRef(0);
  const offsets = useRef<number[]>([]);

  const latencyOf = useCallback((timestamp: number) => {
    let raw = Date.now() - timestamp;
    // Rough clock-skew guard: the smallest observed (receive - send) delta is
    // mostly skew. Only correct when clocks are clearly apart; otherwise trust them.
    if (offsets.current.length) {
      const skew = Math.min(...offsets.current);
      if (Math.abs(skew) > 250) raw -= skew;
    }
    return Math.max(0, Math.min(raw, 2000));
  }, []);

  const send = useCallback((event: OutgoingEvent): HandoffEvent | null => {
    const t = transport.current;
    if (!t) return null;
    const full = { ...event, id: randomId(), timestamp: event.timestamp ?? Date.now() } as HandoffEvent;
    t.send(full);
    return full;
  }, []);

  const sendPresence = useCallback(
    (hello = false) =>
      send({ type: "presence", role, clientId, holding: holding.current, hello }),
    [send, role, clientId],
  );

  // Announce holding changes right away rather than waiting for the heartbeat.
  useEffect(() => {
    if (status === "open") sendPresence();
  }, [opts.holding, status, sendPresence]);

  useEffect(() => {
    let disposed = false;
    const offs: Array<() => void> = [];
    setStatus("connecting");
    setPeer({ connected: false, holding: false });

    const handle = (event: HandoffEvent) => {
      if ("role" in event && event.role === role) return; // another tab with our role
      if ("source" in event && event.source === role) return;
      offsets.current = [...offsets.current.slice(-19), Date.now() - event.timestamp];

      if (event.type === "presence") {
        peerSeen.current = Date.now();
        setPeer((p) =>
          p.connected && p.holding === event.holding ? p : { connected: true, holding: event.holding },
        );
        if (event.hello) sendPresence();
      } else if (event.type === "bye") {
        peerSeen.current = 0;
        setPeer({ connected: false, holding: false });
      }
      onEvent.current(event, latencyOf(event.timestamp));
    };

    createTransport(room, prefer).then(
      (t) => {
        if (disposed) {
          t.close();
          return;
        }
        transport.current = t;
        setKind(t.kind);
        offs.push(t.onEvent(handle));
        offs.push(
          t.onStatus((s) => {
            setStatus(s);
            if (s === "open") sendPresence(true);
          }),
        );
      },
      () => !disposed && setStatus("error"),
    );

    const beat = window.setInterval(() => {
      sendPresence();
      if (peerSeen.current && Date.now() - peerSeen.current > PEER_TIMEOUT_MS) {
        peerSeen.current = 0;
        setPeer({ connected: false, holding: false });
      }
    }, HEARTBEAT_MS);

    const bye = () => send({ type: "bye", role, clientId });
    window.addEventListener("pagehide", bye);

    return () => {
      disposed = true;
      window.clearInterval(beat);
      window.removeEventListener("pagehide", bye);
      bye();
      offs.forEach((off) => off());
      transport.current?.close();
      transport.current = null;
    };
  }, [room, role, prefer, clientId, send, sendPresence, latencyOf]);

  return { room, role, status, kind, peer, send, latencyOf };
}
