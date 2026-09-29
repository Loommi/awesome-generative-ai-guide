"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { Hologram } from "./Holograms";
import type { Slot } from "@/lib/handoff/layout";
import type { ObjectSpec, ObjectStat } from "@/lib/handoff/objects";

const OPEN_MS = 560;
const CLOSE_MS = 340;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_IN = "cubic-bezier(0.5, 0, 0.75, 0)";

export type CloseReason = "dismiss" | "action";

export interface DetailHandle {
  /** Animate back into the slot, then report why it closed. */
  close: (reason?: CloseReason) => void;
}

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Full-screen "inspect" view for one object. The card zooms out of its slot
 * (FLIP), a hologram powers up next to it, and stats count in. Closing plays
 * it all back into the slot.
 */
export function DetailView({
  ref,
  spec,
  from,
  actionLabel,
  actionDisabled,
  onClosed,
}: {
  ref: Ref<DetailHandle>;
  spec: ObjectSpec;
  /** The object's resting slot, where the zoom starts and ends. */
  from: Slot;
  actionLabel: string;
  actionDisabled?: boolean;
  onClosed: (reason: CloseReason) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);

  /** Transform that puts the card back exactly over its slot. */
  const slotTransform = useCallback(() => {
    const el = cardRef.current;
    if (!el) return "none";
    const r = el.getBoundingClientRect();
    const s = from.w / r.width;
    const dx = from.x - (r.left + r.width / 2);
    const dy = from.y - (r.top + r.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${s})`;
  }, [from]);

  // Zoom in from the slot.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el || reducedMotion()) return;
    el.animate([{ transform: slotTransform(), filter: "brightness(1)" }, { transform: "none", filter: "brightness(1.35)", offset: 0.55 }, { transform: "none", filter: "brightness(1)" }], {
      duration: OPEN_MS,
      easing: EASE_OUT,
    });
  }, [slotTransform]);

  const close = useCallback(
    (reason: CloseReason = "dismiss") => {
      if (closingRef.current) return;
      closingRef.current = true;
      setClosing(true);
      const el = cardRef.current;
      if (!el || reducedMotion()) {
        onClosed(reason);
        return;
      }
      const anim = el.animate([{ transform: "none" }, { transform: slotTransform() }], {
        duration: CLOSE_MS,
        easing: EASE_IN,
        fill: "forwards",
      });
      anim.onfinish = () => onClosed(reason);
    },
    [onClosed, slotTransform],
  );

  useImperativeHandle(ref, () => ({ close }), [close]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const particles = Array.from({ length: 18 }, (_, i) => ({
    a: (i / 18) * 360 + (i % 3) * 7,
    d: 140 + ((i * 53) % 120),
    s: 3 + (i % 3) * 2,
  }));

  return (
    <div
      className="detail"
      data-closing={closing}
      style={{ "--accent": spec.accent } as CSSProperties}
      onPointerDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="detail-backdrop" aria-hidden />
      <div className="detail-layout" onPointerDown={(e) => e.target === e.currentTarget && close()}>
        <div className="detail-holo-wrap" aria-hidden>
          <div className="detail-beam" />
          <div className="detail-holo">
            <Hologram kind={spec.hologram} />
          </div>
        </div>

        <div className="detail-card-wrap">
          <div ref={cardRef} className="detail-card">
            <div className="detail-card-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={spec.src} alt={spec.name} draggable={false} />
              <div className="detail-card-sheen" />
            </div>
            <div className="detail-burst" aria-hidden>
              <span className="detail-shock" />
              <span className="detail-shock late" />
              {particles.map((p, i) => (
                <span key={i} className="detail-particle" style={{ "--a": `${p.a}deg`, "--d": `${p.d}px`, "--s": `${p.s}px` } as CSSProperties} />
              ))}
            </div>
          </div>
        </div>

        <section className="detail-info">
          <p className="detail-code">{spec.code}</p>
          <h2 className="detail-name" aria-label={spec.name}>
            {Array.from(spec.name).map((ch, i) => (
              <span key={i} style={{ animationDelay: `${180 + i * 38}ms` }} aria-hidden>
                {ch === " " ? " " : ch}
              </span>
            ))}
          </h2>
          <p className="detail-tagline">{spec.tagline}</p>
          <dl className="detail-stats">
            {spec.stats.map((s, i) => (
              <Stat key={s.label} stat={s} delay={420 + i * 110} />
            ))}
          </dl>
          <p className="detail-desc">{spec.description}</p>
          <div className="detail-actions">
            <button type="button" className="ghost-button accent" onClick={() => close("action")} disabled={actionDisabled}>
              {actionLabel}
            </button>
            <button type="button" className="ghost-button" onClick={() => close()}>
              Close
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/** A stat that counts up from zero and fills its bar. */
function Stat({ stat, delay }: { stat: ObjectStat; delay: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delay;
    const dur = 900;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      setShown(stat.value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stat.value, delay]);

  return (
    <div className="detail-stat" style={{ animationDelay: `${delay - 120}ms` }}>
      <dt>{stat.label}</dt>
      <dd>
        {shown.toLocaleString("en-US", { minimumFractionDigits: stat.decimals ?? 0, maximumFractionDigits: stat.decimals ?? 0 })}
        {stat.unit && <span className="detail-unit">{stat.unit}</span>}
      </dd>
      <span className="detail-bar" style={{ "--fill": stat.fill, animationDelay: `${delay}ms` } as CSSProperties} />
    </div>
  );
}
