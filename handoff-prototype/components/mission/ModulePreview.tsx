"use client";

import type { CSSProperties } from "react";
import type { DeviceRole } from "@/lib/handoff/types";
import type { ObjectPhase } from "@/lib/handoff/useThrowable";
import type { ModuleSpec } from "@/lib/mission/modules";
import { ModuleVisual } from "./ModuleVisual";

export type StatusTone = "ok" | "busy" | "idle";

/** Status shown on a cartridge, derived from its animation phase on this screen. */
export function moduleStatus(role: DeviceRole, phase: ObjectPhase): { label: string; tone: StatusTone } {
  if (phase === "exiting") return { label: role === "controller" ? "TRANSFERRING" : "RETURNING", tone: "busy" };
  if (phase === "entering") return { label: role === "controller" ? "RETRIEVING" : "RECEIVING", tone: "busy" };
  if (role === "display") return { label: "ACTIVE", tone: "ok" };
  return { label: "AVAILABLE", tone: "ok" };
}

/**
 * The mission-data cartridge: the one visual identity a module keeps on both
 * screens and throughout the flight between them. Sized in container units, so
 * it reads the same at 150 px on a tablet and 500 px on a wall.
 */
export function ModulePreview({ spec, status }: { spec: ModuleSpec; status: { label: string; tone: StatusTone } }) {
  return (
    <div className="cart" style={{ "--accent": spec.accent, "--i": Number(spec.number) } as CSSProperties}>
      <div className="cart-top">
        <span className="cart-num">MOD {spec.number}</span>
        <span className="cart-status" data-tone={status.tone}>
          <i aria-hidden />
          {status.label}
        </span>
      </div>
      <div className="cart-art">
        <ModuleVisual kind={spec.key} variant="card" />
      </div>
      <div className="cart-body">
        <p className="cart-title">{spec.title}</p>
        <h3 className="cart-name">{spec.name}</h3>
        <p className="cart-summary">{spec.summary}</p>
      </div>
      <dl className="cart-facts">
        {spec.facts.slice(0, 2).map((f, i) => (
          <div key={i}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
      <span className="cart-scan" aria-hidden />
      <span className="cart-holo" aria-hidden />
      <span className="cart-sheen" aria-hidden />
      <span className="cart-frame" aria-hidden />
    </div>
  );
}
