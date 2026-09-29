"use client";

import type { CSSProperties } from "react";
import type { HologramKind } from "@/lib/handoff/objects";

/**
 * Animated holographic projections for the detail view. Pure SVG + CSS/SMIL
 * animation, so they run on the compositor and cost nothing when closed.
 * All drawn in a 600×600 box centred on (300, 300), coloured by --accent.
 */
export function Hologram({ kind }: { kind: HologramKind }) {
  return (
    <svg className="holo" viewBox="0 0 600 600" aria-hidden>
      <defs>
        <radialGradient id="holo-core" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.35" className="holo-stop-bright" />
          <stop offset="1" className="holo-stop-clear" />
        </radialGradient>
        <linearGradient id="holo-sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className="holo-stop-clear" />
          <stop offset="1" className="holo-stop-bright" />
        </linearGradient>
        <clipPath id="holo-disc">
          <circle cx="300" cy="300" r="270" />
        </clipPath>
      </defs>
      <HudFrame />
      <g className="holo-scene">
        {kind === "seed" && <SeedScene />}
        {kind === "shard" && <ShardScene />}
        {kind === "terrain" && <TerrainScene />}
        {kind === "bloom" && <BloomScene />}
      </g>
      {/* Scan line sweeping through the projection. */}
      <g clipPath="url(#holo-disc)">
        <rect className="holo-scanline" x="0" y="0" width="600" height="3" />
      </g>
    </svg>
  );
}

/** Rotating rings, ticks and arcs shared by every projection. */
function HudFrame() {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    const r1 = i % 6 === 0 ? 268 : 276;
    return (
      <line
        key={i}
        x1={300 + Math.cos(a) * r1}
        y1={300 + Math.sin(a) * r1}
        x2={300 + Math.cos(a) * 284}
        y2={300 + Math.sin(a) * 284}
      />
    );
  });
  return (
    <g className="holo-hud">
      <circle className="holo-ring holo-spin-slow" cx="300" cy="300" r="292" strokeDasharray="2 10" />
      <g className="holo-ticks holo-spin-rev">{ticks}</g>
      <g className="holo-spin">
        <path className="holo-arc" d="M300 40 A260 260 0 0 1 525 170" />
        <path className="holo-arc" d="M300 560 A260 260 0 0 1 75 430" />
      </g>
      <circle className="holo-ring faint" cx="300" cy="300" r="250" />
    </g>
  );
}

// --- Lumen Seed: a rotating wireframe globe with orbiting particles -----------

function SeedScene() {
  const R = 150;
  const longitudes = Array.from({ length: 6 }, (_, i) => (
    <ellipse key={i} className="holo-line" cx="300" cy="300" rx={R} ry={R}>
      <animate
        attributeName="rx"
        values={`${R};0;${R}`}
        dur="6s"
        begin={`${-i}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
      />
    </ellipse>
  ));
  const latitudes = [-100, -55, 0, 55, 100].map((dy) => {
    const rx = Math.sqrt(R * R - dy * dy);
    return <ellipse key={dy} className="holo-line dim" cx="300" cy={300 + dy} rx={rx} ry={rx * 0.22} />;
  });
  return (
    <g>
      <circle className="holo-fill-soft holo-breathe" cx="300" cy="300" r="175" />
      {latitudes}
      {longitudes}
      <circle className="holo-line strong" cx="300" cy="300" r={R} />
      {[
        { rot: -18, rx: 225, ry: 58, dur: 5 },
        { rot: 32, rx: 205, ry: 38, dur: 7.5 },
        { rot: 80, rx: 190, ry: 30, dur: 9 },
      ].map((o, i) => {
        const path = `M${300 - o.rx} 300 a${o.rx} ${o.ry} 0 1 0 ${o.rx * 2} 0 a${o.rx} ${o.ry} 0 1 0 ${-o.rx * 2} 0`;
        return (
          <g key={i} transform={`rotate(${o.rot} 300 300)`}>
            <path className="holo-line orbit" d={path} />
            <circle className="holo-dot glow" r={i === 0 ? 6 : 4}>
              <animateMotion dur={`${o.dur}s`} repeatCount="indefinite" path={path} />
            </circle>
            <circle className="holo-dot" r="2.5">
              <animateMotion dur={`${o.dur}s`} begin={`${-o.dur / 2}s`} repeatCount="indefinite" path={path} />
            </circle>
          </g>
        );
      })}
      <circle cx="300" cy="300" r="62" fill="url(#holo-core)">
        <animate attributeName="r" values="56;72;56" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle className="holo-pulse-ring" cx="300" cy="300" r="70" />
    </g>
  );
}

// --- Aurora Shard: a turning crystal throwing light rays ---------------------

function ShardScene() {
  const rays = Array.from({ length: 12 }, (_, i) => (
    <polygon key={i} className="holo-ray" points="300,300 292,40 308,40" transform={`rotate(${i * 30} 300 300)`} />
  ));
  const sparkles = [
    [150, 170, 0], [460, 150, 0.6], [470, 420, 1.2], [140, 430, 1.8], [300, 90, 0.9], [230, 510, 1.5], [520, 300, 0.3], [85, 300, 2.1],
  ].map(([x, y, d], i) => (
    <path
      key={i}
      className="holo-sparkle"
      style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` } as CSSProperties}
      d={`M${x} ${y - 12} L${x + 3} ${y - 3} L${x + 12} ${y} L${x + 3} ${y + 3} L${x} ${y + 12} L${x - 3} ${y + 3} L${x - 12} ${y} L${x - 3} ${y - 3}Z`}
    />
  ));
  const orbiters = [0, 120, 240].map((a) => (
    <polygon key={a} className="holo-facet-b" points="0,-18 10,0 0,22 -10,0" transform={`rotate(${a} 300 300) translate(300 105)`} />
  ));
  return (
    <g>
      <g className="holo-spin-slow">{rays}</g>
      <g className="holo-spin">{orbiters}</g>
      <g className="holo-crystal">
        <polygon className="holo-facet-b" points="300,90 372,250 342,470 300,510 258,470 228,250" />
        <polygon className="holo-facet-a" points="300,90 372,250 300,290" />
        <polygon className="holo-facet-c" points="300,90 228,250 300,290" />
        <polygon className="holo-facet-a dim" points="372,250 300,290 342,470" />
        <path className="holo-line strong" d="M300 90 L300 290 L258 470 M300 290 L342 470 M228 250 L300 290 L372 250" />
        <polygon className="holo-line strong" points="300,90 372,250 342,470 300,510 258,470 228,250" />
      </g>
      <circle cx="300" cy="290" r="54" fill="url(#holo-core)">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite" />
      </circle>
      {sparkles}
    </g>
  );
}

// --- Tidal Map: contours drawing in as 3D terrain, radar sweep, pins ----------

function contour(i: number) {
  const rx = 220 - i * 22;
  const ry = 110 - i * 11;
  const pts: string[] = [];
  for (let k = 0; k <= 360; k += 8) {
    const t = (k * Math.PI) / 180;
    const wob = 1 + 0.09 * Math.sin(3 * t + i * 0.7) + 0.05 * Math.cos(5 * t - i);
    pts.push(`${(300 + rx * wob * Math.cos(t)).toFixed(1)},${(350 + ry * wob * Math.sin(t) - i * 16).toFixed(1)}`);
  }
  return pts.join(" ");
}

function TerrainScene() {
  const layers = Array.from({ length: 9 }, (_, i) => (
    <polygon
      key={i}
      className="holo-contour"
      pathLength={1}
      points={contour(i)}
      style={{ animationDelay: `${0.15 + i * 0.09}s`, opacity: 0.35 + i * 0.07 } as CSSProperties}
    />
  ));
  const pins = [
    { x: 300, y: 222, d: 1.1, label: "2,418 M" },
    { x: 190, y: 330, d: 1.3, label: "" },
    { x: 420, y: 300, d: 1.5, label: "" },
  ];
  return (
    <g>
      <g className="holo-float">
        <g className="holo-grid">
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`h${i}`} x1="80" x2="520" y1={300 + i * 22} y2={300 + i * 22} />
          ))}
        </g>
        {layers}
        {pins.map((p, i) => (
          <g key={i} className="holo-pin" style={{ animationDelay: `${p.d}s` } as CSSProperties}>
            <line className="holo-line strong" x1={p.x} x2={p.x} y1={p.y} y2={p.y - 46} />
            <circle className="holo-dot glow" cx={p.x} cy={p.y - 46} r={i === 0 ? 6 : 4} />
            <circle className="holo-ping" cx={p.x} cy={p.y} r="16" style={{ transformOrigin: `${p.x}px ${p.y}px` } as CSSProperties} />
            {p.label && (
              <text className="holo-label" x={p.x + 12} y={p.y - 52}>
                {p.label}
              </text>
            )}
          </g>
        ))}
      </g>
      <g className="holo-radar">
        <path d="M300 300 L300 30 A270 270 0 0 1 491 109 Z" fill="url(#holo-sweep)" opacity="0.28" />
        <line className="holo-line strong" x1="300" y1="300" x2="491" y2="109" />
      </g>
    </g>
  );
}

// --- Signal Bloom: pulse waves, rays growing out, nodes firing ---------------

function BloomScene() {
  const N = 24;
  const rays = Array.from({ length: N }, (_, i) => {
    const t = (2 * Math.PI * i) / N;
    const L = 175 + ((i * 37) % 60);
    const x = 300 + L * Math.cos(t);
    const y = 300 + L * Math.sin(t);
    const mx = 300 + 0.55 * L * Math.cos(t + 0.4);
    const my = 300 + 0.55 * L * Math.sin(t + 0.4);
    const delay = ((i * 7) % N) * 0.12;
    return (
      <g key={i}>
        <path
          className="holo-bloom-ray"
          pathLength={1}
          d={`M300 300 Q${mx.toFixed(1)} ${my.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`}
          style={{ animationDelay: `${delay}s` } as CSSProperties}
        />
        <circle
          className="holo-node"
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 6 : 4}
          style={{ animationDelay: `${delay + 0.9}s`, transformOrigin: `${x}px ${y}px` } as CSSProperties}
        />
      </g>
    );
  });
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <circle key={i} className="holo-wave" cx="300" cy="300" r="120" style={{ animationDelay: `${i * 0.9}s` } as CSSProperties} />
      ))}
      {rays}
      <g className="holo-spin">
        <path className="holo-star" d="M300 230 L312 288 L370 300 L312 312 L300 370 L288 312 L230 300 L288 288Z" />
      </g>
      <circle cx="300" cy="300" r="58" fill="url(#holo-core)">
        <animate attributeName="r" values="50;66;50" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}
