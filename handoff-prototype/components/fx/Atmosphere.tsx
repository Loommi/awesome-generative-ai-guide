"use client";

import type { DeviceRole } from "@/lib/handoff/types";

/**
 * Screen-wide backdrop: drifting starfield, scanlines, vignette, a slow scan
 * band and HUD corner brackets. Purely decorative and never interactive.
 */
export function Atmosphere({ role }: { role: DeviceRole }) {
  return (
    <div className={`atmo atmo-${role}`} aria-hidden>
      <div className="atmo-stars atmo-stars-far" />
      <div className="atmo-stars atmo-stars-mid" />
      <div className="atmo-stars atmo-stars-near" />
      <div className="atmo-nebula" />
      <div className="atmo-band" />
      <div className="atmo-scanlines" />
      <div className="atmo-vignette" />
      <span className="hud-corner tl" />
      <span className="hud-corner tr" />
      <span className="hud-corner bl" />
      <span className="hud-corner br" />
      <div className="hud-ticks hud-ticks-left" />
      <div className="hud-ticks hud-ticks-right" />
    </div>
  );
}
