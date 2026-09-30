"use client";

import { useId } from "react";
import { THEME } from "@/lib/mission/theme";
import type { VisualVariant } from "./ModuleVisual";

const R = THEME.red;

/**
 * Observational scan of the unidentified structure. The form is deliberately
 * incomplete: occluded by a no-data band, displaced by signal noise, with
 * unresolved readouts. It suggests without revealing.
 */
export function AnomalyVisualization({ variant }: { variant: VisualVariant }) {
  const id = useId().replace(/:/g, "");
  const full = variant === "full";
  const cx = full ? 400 : 480;
  const cy = 300;
  return (
    <svg className={`viz viz-anomaly viz-${variant}`} viewBox="0 0 960 600" aria-hidden>
      <defs>
        <filter id={`${id}-noise`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.4" numOctaves="2" seed="7" result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale={full ? 14 : 10} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <pattern id={`${id}-hatch`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="10" stroke={R} strokeOpacity="0.35" strokeWidth="2" />
        </pattern>
        <clipPath id={`${id}-scope`}>
          <circle cx={cx} cy={cy} r="230" />
        </clipPath>
        <linearGradient id={`${id}-sweep`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={R} stopOpacity="0" />
          <stop offset="1" stopColor={R} stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* scope */}
      <g stroke={R} fill="none">
        {[230, 170, 110, 50].map((r, i) => (
          <circle key={r} cx={cx} cy={cy} r={r} strokeOpacity={i === 0 ? 0.6 : 0.2} />
        ))}
        <line x1={cx - 250} x2={cx + 250} y1={cy} y2={cy} strokeOpacity="0.25" />
        <line x1={cx} x2={cx} y1={cy - 250} y2={cy + 250} strokeOpacity="0.25" />
        {Array.from({ length: 36 }, (_, i) => {
          const a = (i / 36) * Math.PI * 2;
          const r1 = i % 3 === 0 ? 236 : 240;
          return <line key={i} x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1} x2={cx + Math.cos(a) * 248} y2={cy + Math.sin(a) * 248} strokeOpacity="0.5" />;
        })}
      </g>

      <g clipPath={`url(#${id}-scope)`}>
        {/* the structure: partial lattice, displaced by signal noise */}
        <g filter={`url(#${id}-noise)`} className="structure-jitter">
          <g stroke={THEME.text} fill="none" strokeOpacity="0.85">
            <ellipse cx={cx} cy={cy} rx="150" ry="60" strokeWidth="2" />
            <ellipse cx={cx} cy={cy} rx="120" ry="44" strokeOpacity="0.5" />
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <line key={i} x1={cx + Math.cos(a) * 120} y1={cy + Math.sin(a) * 44} x2={cx + Math.cos(a) * 150} y2={cy + Math.sin(a) * 60} strokeOpacity="0.6" />
              );
            })}
            <path d={`M${cx - 20} ${cy - 150} L${cx + 20} ${cy - 150} L${cx + 12} ${cy + 150} L${cx - 12} ${cy + 150} Z`} strokeOpacity="0.55" />
          </g>
          <ellipse cx={cx} cy={cy} rx="150" ry="60" fill={R} fillOpacity="0.06" />
        </g>
        {/* no-data band hides part of it */}
        <rect x={cx + 30} y={cy - 240} width="90" height="480" fill={THEME.bg} />
        <rect x={cx + 30} y={cy - 240} width="90" height="480" fill={`url(#${id}-hatch)`} />
        {/* rotating sweep */}
        <g className="scope-sweep" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <path d={`M${cx} ${cy} L${cx} ${cy - 230} A230 230 0 0 1 ${cx + 163} ${cy - 163} Z`} fill={`url(#${id}-sweep)`} />
        </g>
        {/* horizontal interference line */}
        <rect x={cx - 240} y={cy} width="480" height="2" fill={R} opacity="0.5" className="interference" />
      </g>

      {full ? (
        <g fontFamily="var(--font-mono)" letterSpacing="3">
          <text x="680" y="140" fill={R} fontSize="15">
            UNIDENTIFIED STRUCTURE
          </text>
          <text x="680" y="176" fill={THEME.text} fontSize="24">
            PROXIMA SYSTEM
          </text>
          <line x1="680" x2="920" y1="200" y2="200" stroke={R} strokeOpacity="0.4" />
          {[
            ["OBSERVATIONAL DATA", "PARTIAL"],
            ["SIGNAL", "DEGRADED"],
            ["ORIGIN", "UNRESOLVED"],
            ["PURPOSE", "UNRESOLVED"],
          ].map(([k, v], i) => (
            <g key={k}>
              <text x="680" y={244 + i * 48} fill={THEME.textDim} fontSize="12">
                {k}
              </text>
              <text x="680" y={266 + i * 48} fill={THEME.text} fontSize="16">
                {v}
              </text>
            </g>
          ))}
          <rect x="680" y="440" width="270" height="44" fill="none" stroke={R} strokeOpacity="0.7" />
          <text x="815" y="467" textAnchor="middle" fill={R} fontSize="13" letterSpacing="2">
            CLASSIFICATION: UNKNOWN
          </text>
          <text x={cx} y={cy + 292} textAnchor="middle" fill={THEME.textDim} fontSize="12">
            NO DATA
          </text>
        </g>
      ) : null}
    </svg>
  );
}
