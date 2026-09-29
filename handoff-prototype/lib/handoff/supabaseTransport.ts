import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";
import { Emitter, type Transport } from "./transport";
import type { HandoffEvent, TransportStatus } from "./types";

const EVENT = "handoff";

/** Supabase Realtime "broadcast" channel. No tables or auth needed. */
export class SupabaseTransport implements Transport {
  readonly kind = "supabase" as const;
  private client: SupabaseClient;
  private channel: RealtimeChannel;
  private events = new Emitter<HandoffEvent>();
  private status = new Emitter<TransportStatus>();
  private current: TransportStatus = "connecting";

  constructor(name: string, url: string, key: string) {
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      realtime: { params: { eventsPerSecond: 30 } },
    });
    this.channel = this.client.channel(name, {
      config: { broadcast: { self: false, ack: false } },
    });
    this.channel
      .on("broadcast", { event: EVENT }, ({ payload }) => this.events.emit(payload as HandoffEvent))
      .subscribe((state) => {
        if (state === "SUBSCRIBED") this.setStatus("open");
        else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT") this.setStatus("error");
        else if (state === "CLOSED") this.setStatus("closed");
      });
  }

  private setStatus(status: TransportStatus) {
    this.current = status;
    this.status.emit(status);
  }

  send(event: HandoffEvent) {
    // Websocket send; httpSend would add a round trip we don't want.
    void this.channel.send({ type: "broadcast", event: EVENT, payload: event });
  }

  onEvent(listener: (event: HandoffEvent) => void) {
    return this.events.on(listener);
  }

  onStatus(listener: (status: TransportStatus) => void) {
    const current = this.current;
    queueMicrotask(() => listener(current));
    return this.status.on(listener);
  }

  close() {
    void this.client.removeChannel(this.channel);
    this.events.clear();
    this.status.clear();
  }
}
