"use client";

/** Radar reticle behind the wall's empty state. */
export function IdleReticle({ show }: { show: boolean }) {
  const ticks = Array.from({ length: 72 }, (_, i) => i);
  return (
    <div className="idle-reticle" data-show={show} aria-hidden>
      <svg viewBox="-300 -300 600 600">
        <defs>
          <linearGradient id="idle-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#63D9E8" stopOpacity="0" />
            <stop offset="1" stopColor="#63D9E8" stopOpacity="0.28" />
          </linearGradient>
        </defs>
        <g fill="none" stroke="#63D9E8">
          <circle r="280" strokeOpacity="0.18" />
          <circle r="210" strokeOpacity="0.1" strokeDasharray="2 10" className="idle-spin-rev" />
          <circle r="140" strokeOpacity="0.14" />
          <circle r="70" strokeOpacity="0.08" />
          <line x1="-300" x2="300" strokeOpacity="0.08" />
          <line y1="-300" y2="300" strokeOpacity="0.08" />
          <g className="idle-spin" strokeOpacity="0.35">
            {ticks.map((i) => {
              const a = (i / ticks.length) * Math.PI * 2;
              const r1 = i % 6 === 0 ? 262 : 272;
              return <line key={i} x1={Math.cos(a) * r1} y1={Math.sin(a) * r1} x2={Math.cos(a) * 280} y2={Math.sin(a) * 280} />;
            })}
          </g>
        </g>
        <g className="idle-sweep">
          <circle r="280" fill="none" stroke="none" />
          <path d="M0 0 L0 -280 A280 280 0 0 1 198 -198 Z" fill="url(#idle-sweep)" />
          <line x1="0" y1="0" x2="198" y2="-198" stroke="#63D9E8" strokeOpacity="0.5" />
        </g>
      </svg>
    </div>
  );
}
