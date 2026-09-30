"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type Ref } from "react";
import type { ModuleSpec } from "@/lib/mission/modules";
import { ModuleVisual } from "./ModuleVisual";

export type CloseReason = "dismiss" | "action";

export interface InspectorHandle {
  /** Play the exit, then report why it closed. */
  close: (reason?: CloseReason) => void;
}

const CLOSE_MS = 220;

/**
 * Expanded visualization for one module. On the wall it fills the region
 * between the header and the dock of minimised modules; on the tablet it
 * covers the screen. It never touches the objects themselves, so handoffs in
 * flight keep animating underneath/alongside it.
 */
export function ModuleInspector({
  ref,
  spec,
  region,
  actionLabel,
  actionDisabled,
  onClosed,
}: {
  ref: Ref<InspectorHandle>;
  spec: ModuleSpec;
  /** Top/bottom insets in px; omit for full screen. */
  region?: { top: number; bottom: number };
  actionLabel: string;
  actionDisabled?: boolean;
  onClosed: (reason: CloseReason) => void;
}) {
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  const close = useCallback(
    (reason: CloseReason = "dismiss") => {
      if (closingRef.current) return;
      closingRef.current = true;
      setClosing(true);
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(() => onClosed(reason), reduced ? 0 : CLOSE_MS);
    },
    [onClosed],
  );

  useImperativeHandle(ref, () => ({ close }), [close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const style = {
    "--accent": spec.accent,
    ...(region ? { top: region.top, bottom: region.bottom } : {}),
  } as CSSProperties;

  return (
    <section className="inspector" data-mode={region ? "region" : "full"} data-closing={closing} style={style} aria-label={`${spec.name} — ${spec.title}`}>
      <header className="insp-head">
        <div className="insp-id">
          <p className="insp-num">MODULE {spec.number}</p>
          <h2 className="insp-name">{spec.name}</h2>
          <p className="insp-title">{spec.title}</p>
        </div>
        <div className="insp-actions">
          <button type="button" className="mc-button accent" onClick={() => close("action")} disabled={actionDisabled}>
            {actionLabel}
          </button>
          <button type="button" className="mc-button icon" onClick={() => close()} aria-label="Close">
            ✕
          </button>
        </div>
      </header>
      <div className="insp-body">
        <div className="insp-viz">
          <ModuleVisual kind={spec.key} variant="full" />
          <p className="insp-note">{spec.note}</p>
        </div>
        <aside className="insp-side">
          <dl className="insp-facts">
            {spec.facts.map((f, i) => (
              <div key={i} style={{ animationDelay: `${160 + i * 70}ms` }}>
                <dt>{f.label}</dt>
                <dd data-unresolved={f.unresolved || undefined}>{f.value}</dd>
              </div>
            ))}
          </dl>
          {spec.panels.map((p, i) => (
            <section key={p.title} className="insp-panel" style={{ animationDelay: `${380 + i * 90}ms` }}>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </section>
          ))}
        </aside>
      </div>
    </section>
  );
}
