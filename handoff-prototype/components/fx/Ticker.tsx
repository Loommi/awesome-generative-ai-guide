"use client";

import { useEffect, useState } from "react";

/** Bottom telemetry strip on the wall: live link state, local clock and a scrolling registry line. */
export function Ticker({ items, show }: { items: string[]; show: boolean }) {
  const [clock, setClock] = useState("--:--:--");
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);
  const line = items.join("   ·   ");
  return (
    <div className="ticker" data-show={show} aria-hidden>
      <span className="ticker-label">TELEMETRY</span>
      <div className="ticker-track">
        <div className="ticker-run">
          <span>{line}</span>
          <span>{line}</span>
        </div>
      </div>
      <span className="ticker-clock">LOCAL {clock}</span>
    </div>
  );
}
