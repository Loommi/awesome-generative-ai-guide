import type { HandoffEvent, TransportKind, TransportStatus } from "./types";

/**
 * Minimal realtime pipe shared by both clients in a room.
 * Implementations must not echo a client's own messages back to it.
 */
export interface Transport {
  readonly kind: TransportKind;
  send(event: HandoffEvent): void;
  onEvent(listener: (event: HandoffEvent) => void): () => void;
  onStatus(listener: (status: TransportStatus) => void): () => void;
  close(): void;
}

export function supabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

export function supabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
}

export function supabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    undefined
  );
}

/**
 * Supabase Realtime when configured, otherwise BroadcastChannel (same browser only).
 * `?transport=local` forces the local fallback.
 */
export async function createTransport(room: string, prefer?: TransportKind): Promise<Transport> {
  const channel = `handoff:${room.toUpperCase()}`;
  if (prefer !== "broadcast" && supabaseConfigured()) {
    const { SupabaseTransport } = await import("./supabaseTransport");
    return new SupabaseTransport(channel, supabaseUrl()!, supabaseKey()!);
  }
  const { BroadcastTransport } = await import("./broadcastTransport");
  return new BroadcastTransport(channel);
}

/** Tiny listener set used by transports. */
export class Emitter<T> {
  private listeners = new Set<(value: T) => void>();
  on(listener: (value: T) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  emit(value: T) {
    this.listeners.forEach((l) => l(value));
  }
  clear() {
    this.listeners.clear();
  }
}
