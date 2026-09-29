export type DeviceRole = "controller" | "display";

export const OBJECT_ID = "demo-object-01";

export interface Vec2 {
  x: number;
  y: number;
}

/** The object leaves `source` and should continue its motion on `destination`. */
export interface ObjectHandoffEvent {
  type: "object_handoff";
  id: string;
  objectId: string;
  source: DeviceRole;
  destination: DeviceRole;
  /** Unit vector of travel, screen coordinates (y points down). */
  direction: Vec2;
  /** Release speed in source px/s. */
  velocity: number;
  /** Release speed in source viewport-heights/s, so screens of any size agree. */
  velocityNorm: number;
  /** Release point, normalized 0..1 in the source viewport. */
  release: Vec2;
  /** Where the object's centre crossed the source edge, normalized 0..1 along that edge. */
  edgeX: number;
  /** Duration of the outgoing animation on the source, ms. */
  exitDuration: number;
  /** Date.now() on the source at release. */
  timestamp: number;
}

/** The controller asks the display to send the object back. */
export interface ObjectRecallEvent {
  type: "object_recall";
  id: string;
  objectId: string;
  source: DeviceRole;
  timestamp: number;
}

/** Heartbeat / hello. `holding` lets a peer that reloaded recover who owns the object. */
export interface PresenceEvent {
  type: "presence";
  id: string;
  role: DeviceRole;
  clientId: string;
  holding: boolean;
  /** Set on the first message after joining, asks peers to answer immediately. */
  hello?: boolean;
  timestamp: number;
}

export interface ByeEvent {
  type: "bye";
  id: string;
  role: DeviceRole;
  clientId: string;
  timestamp: number;
}

export type HandoffEvent = ObjectHandoffEvent | ObjectRecallEvent | PresenceEvent | ByeEvent;

/** Distributive Omit so callers can build any event without id/timestamp. */
export type OutgoingEvent = HandoffEvent extends infer E
  ? E extends HandoffEvent
    ? Omit<E, "id" | "timestamp"> & { timestamp?: number }
    : never
  : never;

export type TransportStatus = "connecting" | "open" | "error" | "closed";
export type TransportKind = "supabase" | "broadcast";
