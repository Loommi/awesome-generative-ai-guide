"use client";

import { useId } from "react";
import { THEME } from "@/lib/mission/theme";
import type { VisualVariant } from "./ModuleVisual";

const C = THEME.cyan;

/**
 * Eos, drawn as a clearly conceptual line rendering: forward section, two
 * habitat rings on a central spine, aft section. Layers drift at different
 * rates for a gentle parallax. No canonical dimensions are implied.
 */
export function VesselVisualization({ variant }: { variant: VisualVariant }) {
  const id = useId().replace(/:/g, "");
  const full = variant === "full";
  const stars = STARS.slice(0, full ? STARS.length : 24);
  return (
    <svg className={`viz viz-vessel viz-${variant}`} viewBox="0 0 960 600" aria-hidden>
      <defs>
        <linearGradient id={`${id}-hull`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={THEME.surface2} />
          <stop offset="1" stopColor={THEME.surface} />
        </linearGradient>
        <radialGradient id={`${id}-drive`} cx="0" cy="0.5" r="1">
          <stop offset="0" stopColor={C} stopOpacity="0.45" />
          <stop offset="1" stopColor={C} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Layer 1: distant stars, slowest drift */}
      <g className="parallax-far">
        {stars.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={THEME.text} opacity={0.18 + (i % 4) * 0.08} />
        ))}
      </g>

      {/* Layer 2: engineering grid */}
      {full && (
        <g className="parallax-mid" stroke={C} strokeOpacity="0.07">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={80 + i * 80} x2={80 + i * 80} y1="60" y2="540" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1="80" x2="880" y1={60 + i * 80} y2={60 + i * 80} />
          ))}
        </g>
      )}

      {/* Layer 3: the vessel */}
      <g className="parallax-near vessel">
        {/* drive glow */}
        <ellipse cx="820" cy="300" rx="120" ry="46" fill={`url(#${id}-drive)`} className="drive-glow" />
        {/* spine */}
        <rect x="190" y="294" width="600" height="12" rx="2" fill={`url(#${id}-hull)`} stroke={C} strokeOpacity="0.55" />
        <line x1="190" x2="790" y1="300" y2="300" stroke={C} strokeOpacity="0.25" strokeDasharray="2 6" />
        {/* forward section */}
        <path d="M190 262 L150 276 Q126 300 150 324 L190 338 Z" fill={`url(#${id}-hull)`} stroke={C} strokeOpacity="0.8" />
        <path d="M150 276 Q126 300 150 324" fill="none" stroke={C} strokeWidth="2" />
        {/* truss + modules */}
        {[250, 610, 660, 710].map((x) => (
          <g key={x}>
            <rect x={x} y="276" width="36" height="48" fill={`url(#${id}-hull)`} stroke={C} strokeOpacity="0.5" />
            <line x1={x} x2={x + 36} y1="276" y2="324" stroke={C} strokeOpacity="0.2" />
          </g>
        ))}
        {/* habitat rings */}
        {[380, 510].map((x, i) => (
          <g key={x}>
            {[-1, 1].map((s) => (
              <line key={s} x1={x} x2={x} y1="300" y2={300 + s * 118} stroke={C} strokeOpacity="0.35" />
            ))}
            <line x1={x - 26} x2={x + 26} y1="300" y2="300" stroke={C} strokeOpacity="0.35" />
            <ellipse cx={x} cy="300" rx="34" ry="124" fill="none" stroke={C} strokeOpacity="0.9" strokeWidth="2" />
            <ellipse cx={x} cy="300" rx="26" ry="112" fill="none" stroke={C} strokeOpacity="0.3" />
            <ellipse
              cx={x}
              cy="300"
              rx="34"
              ry="124"
              fill="none"
              stroke={THEME.text}
              strokeWidth="3"
              strokeDasharray="10 44"
              className="ring-spin"
              style={{ animationDelay: `${-i * 2}s` }}
            />
          </g>
        ))}
        {/* radiators */}
        {[-1, 1].map((s) => (
          <path
            key={s}
            d={`M600 ${300 + s * 8} L640 ${300 + s * 70} L720 ${300 + s * 70} L700 ${300 + s * 8} Z`}
            fill={THEME.surface}
            stroke={C}
            strokeOpacity="0.45"
          />
        ))}
        {/* aft / propulsion */}
        <path d="M790 280 L840 262 L840 338 L790 320 Z" fill={`url(#${id}-hull)`} stroke={C} strokeOpacity="0.8" />
      </g>

      {/* Layer 4: callouts, drift opposite for depth */}
      {full && (
        <g className="parallax-front callouts" fill={THEME.textDim} fontFamily="var(--font-mono)" fontSize="15" letterSpacing="2.5">
          <Callout x={150} y={276} lx={110} ly={150} label="FORWARD SECTION" />
          <Callout x={445} y={176} lx={445} ly={96} label="HABITAT SECTION" anchor="middle" />
          <Callout x={840} y={338} lx={820} ly={470} label="AFT SECTION" anchor="end" />
        </g>
      )}
    </svg>
  );
}

function Callout({ x, y, lx, ly, label, anchor = "start" }: { x: number; y: number; lx: number; ly: number; label: string; anchor?: "start" | "middle" | "end" }) {
  const ty = ly < y ? ly - 10 : ly + 22;
  return (
    <g>
      <circle cx={x} cy={y} r="3.5" fill={C} />
      <polyline points={`${x},${y} ${lx},${ly}`} fill="none" stroke={C} strokeOpacity="0.5" />
      <text x={lx} y={ty} textAnchor={anchor}>
        {label}
      </text>
    </g>
  );
}

// Deterministic star positions (no Math.random: SSR and client must agree).
const STARS: Array<[number, number, number]> = Array.from({ length: 60 }, (_, i) => {
  const x = (i * 197 + 53) % 940 + 10;
  const y = (i * 131 + 29) % 580 + 10;
  return [x, y, i % 7 === 0 ? 1.8 : 1];
});
