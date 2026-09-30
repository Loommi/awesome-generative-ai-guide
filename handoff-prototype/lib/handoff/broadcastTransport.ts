import { Emitter, type Transport } from "./transport";
import type { HandoffEvent, TransportStatus } from "./types";

/** Local fallback: works between tabs/windows of the same browser profile. */
export class BroadcastTransport implements Transport {
  readonly kind = "broadcast" as const;
  private channel: BroadcastChannel;
  private events = new Emitter<HandoffEvent>();
  private status = new Emitter<TransportStatus>();

  constructor(name: string) {
    this.channel = new BroadcastChannel(name);
    this.channel.onmessage = (msg) => this.events.emit(msg.data as HandoffEvent);
  }

  send(event: HandoffEvent) {
    this.channel.postMessage(event);
  }

  onEvent(listener: (event: HandoffEvent) => void) {
    return this.events.on(listener);
  }

  onStatus(listener: (status: TransportStatus) => void) {
    // BroadcastChannel is usable immediately.
    queueMicrotask(() => listener("open"));
    return this.status.on(listener);
  }

  close() {
    this.channel.close();
    this.events.clear();
    this.status.clear();
  }
}
