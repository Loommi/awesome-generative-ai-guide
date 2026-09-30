"use client";

import { useId } from "react";
import { THEME } from "@/lib/mission/theme";
import type { VisualVariant } from "./ModuleVisual";

const A = THEME.amber;
const ARC = "M170 380 C 360 140, 620 140, 800 250";

/**
 * Star-map style plot from Sol to Proxima Centauri. Instrument look: coordinate
 * grid, orbit guides, a dashed transit arc with flowing dashes. The Eos marker's
 * position is illustrative only — no distances or progress figures are shown.
 */
export function NavigationVisualization({ variant }: { variant: VisualVariant }) {
  const id = useId().replace(/:/g, "");
  const full = variant === "full";
  return (
    <svg className={`viz viz-nav viz-${variant}`} viewBox="0 0 960 600" aria-hidden>
      <defs>
        <radialGradient id={`${id}-sol`}>
          <stop offset="0" stopColor="#FFF4D6" />
          <stop offset="0.4" stopColor={A} />
          <stop offset="1" stopColor={A} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-prox`}>
          <stop offset="0" stopColor="#FFD8C8" />
          <stop offset="0.4" stopColor={THEME.red} />
          <stop offset="1" stopColor={THEME.red} stopOpacity="0" />
        </radialGradient>
        <path id={`${id}-arc`} d={ARC} />
      </defs>

      {/* coordinate grid */}
      <g stroke={THEME.textDim} strokeOpacity={full ? 0.12 : 0.1}>
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`v${i}`} x1={0 + i * 80} x2={0 + i * 80} y1="0" y2="600" />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`h${i}`} x1="0" x2="960" y1={i * 80 + 20} y2={i * 80 + 20} />
        ))}
      </g>
      {full && (
        <g fill={THEME.textDim} fontFamily="var(--font-mono)" fontSize="11" opacity="0.6">
          {Array.from({ length: 12 }, (_, i) => (
            <text key={i} x={i * 80 + 4} y="592">
              {String(i).padStart(2, "0")}
            </text>
          ))}
        </g>
      )}

      {/* background stars */}
      <g fill={THEME.text}>
        {STARS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} opacity={0.15 + (i % 5) * 0.07} />
        ))}
      </g>

      {/* Sol system */}
      <g>
        {[26, 44, 66, 92].map((r) => (
          <circle key={r} cx="170" cy="380" r={r} fill="none" stroke={A} strokeOpacity="0.28" strokeDasharray={r > 60 ? "2 5" : undefined} />
        ))}
        <circle cx="170" cy="380" r="30" fill={`url(#${id}-sol)`} />
        <circle cx="170" cy="380" r="7" fill="#FFF4D6" />
        <circle cx="214" cy="380" r="3.5" fill="#9AD1FF" className="orbit-body" />
      </g>

      {/* Proxima Centauri */}
      <g>
        {[20, 36].map((r) => (
          <circle key={r} cx="800" cy="250" r={r} fill="none" stroke={THEME.red} strokeOpacity="0.35" />
        ))}
        <circle cx="800" cy="250" r="26" fill={`url(#${id}-prox)`} />
        <circle cx="800" cy="250" r="5.5" fill="#FFD8C8" />
        <circle cx="800" cy="250" r="54" fill="none" stroke={A} strokeOpacity="0.5" strokeDasharray="4 6" className="target-ring" />
      </g>

      {/* trajectory */}
      <path d={ARC} fill="none" stroke={A} strokeOpacity="0.25" strokeWidth="6" />
      <path d={ARC} fill="none" stroke={A} strokeWidth="2" strokeDasharray="10 12" className="dash-flow" />

      {/* Eos marker — illustrative position */}
      <g className="eos-marker">
        <g>
          <animateMotion dur={full ? "18s" : "26s"} repeatCount="indefinite" rotate="auto" keyPoints="0.18;0.62;0.18" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1">
            <mpath href={`#${id}-arc`} />
          </animateMotion>
          <circle r="16" fill="none" stroke={THEME.cyan} strokeOpacity="0.6" className="marker-pulse" />
          <path d="M9 0 L-6 -6 L-3 0 L-6 6 Z" fill={THEME.cyan} />
        </g>
      </g>

      {full && (
        <g fontFamily="var(--font-mono)" letterSpacing="3">
          <text x="170" y="498" textAnchor="middle" fill={THEME.text} fontSize="20">
            SOL SYSTEM
          </text>
          <text x="800" y="336" textAnchor="middle" fill={THEME.text} fontSize="20">
            PROXIMA CENTAURI
          </text>
          <text fill={A} fontSize="15" dy="-14">
            <textPath href={`#${id}-arc`} startOffset="44%" textAnchor="middle">
              EOS TRAJECTORY
            </textPath>
          </text>
          <text x="480" y="470" textAnchor="middle" fill={THEME.textDim} fontSize="15">
            INTERSTELLAR TRANSIT
          </text>
          <line x1="330" x2="630" y1="446" y2="446" stroke={THEME.textDim} strokeOpacity="0.4" strokeDasharray="2 6" />
        </g>
      )}
    </svg>
  );
}

const STARS: Array<[number, number, number]> = Array.from({ length: 70 }, (_, i) => {
  const x = (i * 211 + 17) % 950 + 5;
  const y = (i * 97 + 61) % 590 + 5;
  return [x, y, i % 9 === 0 ? 1.6 : 0.9];
});
