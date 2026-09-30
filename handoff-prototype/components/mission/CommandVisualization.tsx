"use client";

import { THEME } from "@/lib/mission/theme";
import type { VisualVariant } from "./ModuleVisual";

const V = THEME.violet;

/**
 * Command-history record: two abstract identification plates (no portraits),
 * linked by a succession marker, plus an empty slot for future verified records.
 */
export function CommandVisualization({ variant }: { variant: VisualVariant }) {
  const full = variant === "full";
  return (
    <svg className={`viz viz-command viz-${variant}`} viewBox="0 0 960 600" aria-hidden>
      {/* timeline rail */}
      <line x1="80" x2="880" y1="300" y2="300" stroke={V} strokeOpacity="0.25" />
      {Array.from({ length: 21 }, (_, i) => (
        <line key={i} x1={80 + i * 40} x2={80 + i * 40} y1="294" y2={i % 5 === 0 ? "312" : "306"} stroke={V} strokeOpacity="0.35" />
      ))}

      <IdPlate x={250} name="ELENA" rank="CAPTAIN" index="01" full={full} />
      <IdPlate x={560} name="SOPHIA" rank="CAPTAIN" index="02" full={full} />

      {/* succession chevrons */}
      <g className="succession" fill={V}>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M${385 + i * 22} 286 L${399 + i * 22} 300 L${385 + i * 22} 314`} fill="none" stroke={V} strokeWidth="3" style={{ animationDelay: `${i * 0.25}s` }} />
        ))}
      </g>
      {full && (
        <text x="407" y="350" textAnchor="middle" fill={THEME.textDim} fontFamily="var(--font-mono)" fontSize="14" letterSpacing="3">
          PRECEDES
        </text>
      )}

      {/* pending record */}
      <g opacity="0.5">
        <rect x="770" y="190" width="110" height="220" rx="6" fill="none" stroke={THEME.textDim} strokeDasharray="4 8" />
        {full && (
          <text x="825" y="306" textAnchor="middle" fill={THEME.textDim} fontFamily="var(--font-mono)" fontSize="12" letterSpacing="2">
            PENDING
          </text>
        )}
      </g>
    </svg>
  );
}

function IdPlate({ x, name, rank, index, full }: { x: number; name: string; rank: string; index: string; full: boolean }) {
  const cx = x;
  const hex = (r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(236 + r * Math.sin(a)).toFixed(1)}`;
    }).join(" ");
  return (
    <g>
      <rect x={cx - 110} y="130" width="220" height="340" rx="10" fill={THEME.surface} stroke={V} strokeOpacity="0.55" />
      <line x1={cx - 110} x2={cx + 110} y1="170" y2="170" stroke={V} strokeOpacity="0.25" />
      <text x={cx - 94} y="157" fill={THEME.textDim} fontFamily="var(--font-mono)" fontSize="13" letterSpacing="2">
        ID {index}
      </text>
      {/* abstract identification mark */}
      <polygon points={hex(58)} fill="none" stroke={V} strokeWidth="2" />
      <polygon points={hex(44)} fill={V} fillOpacity="0.1" stroke={V} strokeOpacity="0.4" />
      <polygon points={hex(58)} fill="none" stroke={THEME.text} strokeWidth="2.5" strokeDasharray="20 300" className="id-scan" />
      <text x={cx} y="252" textAnchor="middle" fill={THEME.text} fontFamily="var(--font-sans)" fontSize="42" fontWeight="300">
        {name[0]}
      </text>
      <text x={cx} y="360" textAnchor="middle" fill={THEME.text} fontFamily="var(--font-sans)" fontSize={full ? 36 : 40} fontWeight="400" letterSpacing="4">
        {name}
      </text>
      <text x={cx} y="398" textAnchor="middle" fill={V} fontFamily="var(--font-mono)" fontSize="18" letterSpacing="5">
        {rank}
      </text>
      <line x1={cx - 60} x2={cx + 60} y1="430" y2="430" stroke={V} strokeOpacity="0.35" />
    </g>
  );
}
