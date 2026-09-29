/** The shared catalog. Both screens preload every asset; only ids travel over the network. */
export interface ObjectStat {
  label: string;
  value: number;
  decimals?: number;
  unit: string;
  /** How full the bar under the stat is, 0..1. */
  fill: number;
}

export type HologramKind = "seed" | "shard" | "terrain" | "bloom";

export interface ObjectSpec {
  id: string;
  name: string;
  src: string;
  /** Glow colour, as an "r, g, b" triple for rgba(). */
  accent: string;
  /** Small caps label above the name in the detail view. */
  code: string;
  tagline: string;
  description: string;
  stats: ObjectStat[];
  hologram: HologramKind;
}

export const OBJECTS: ObjectSpec[] = [
  {
    id: "demo-object-01",
    name: "Lumen Seed",
    src: "/objects/specimen.svg",
    accent: "95, 240, 220",
    code: "Specimen 01",
    tagline: "Bioluminescent seed, dormant",
    description:
      "A living light source recovered from the canopy layer. It emits at 412 nm when handled, and its brightness follows the pulse of whoever is holding it.",
    stats: [
      { label: "Emission", value: 412, unit: "nm", fill: 0.82 },
      { label: "Viability", value: 97, unit: "%", fill: 0.97 },
      { label: "Core temp", value: 31.4, decimals: 1, unit: "°C", fill: 0.54 },
      { label: "Pulse", value: 62, unit: "bpm", fill: 0.62 },
    ],
    hologram: "seed",
  },
  {
    id: "demo-object-02",
    name: "Aurora Shard",
    src: "/objects/shard.svg",
    accent: "180, 140, 255",
    code: "Crystal 02",
    tagline: "Resonant crystal, hexagonal lattice",
    description:
      "Grown during a magnetic storm. It splits incoming light into six coherent beams and hums at a frequency just below hearing.",
    stats: [
      { label: "Hardness", value: 6.2, decimals: 1, unit: "Mohs", fill: 0.62 },
      { label: "Refraction", value: 2.41, decimals: 2, unit: "n", fill: 0.74 },
      { label: "Resonance", value: 18.6, decimals: 1, unit: "Hz", fill: 0.45 },
      { label: "Purity", value: 99.2, decimals: 1, unit: "%", fill: 0.99 },
    ],
    hologram: "shard",
  },
  {
    id: "demo-object-03",
    name: "Tidal Map",
    src: "/objects/terrain.svg",
    accent: "255, 180, 84",
    code: "Survey 03",
    tagline: "Live terrain survey, sector 14",
    description:
      "A map slab that rescans its terrain every few seconds. The contours shift with the tide, and the marker follows the highest dry ground.",
    stats: [
      { label: "Peak", value: 2418, unit: "m", fill: 0.8 },
      { label: "Coverage", value: 86, unit: "km²", fill: 0.66 },
      { label: "Resolution", value: 25, unit: "cm", fill: 0.9 },
      { label: "Tide", value: 1.7, decimals: 1, unit: "m", fill: 0.35 },
    ],
    hologram: "terrain",
  },
  {
    id: "demo-object-04",
    name: "Signal Bloom",
    src: "/objects/bloom.svg",
    accent: "255, 120, 150",
    code: "Signal 04",
    tagline: "Neural signal bloom, 18 nodes",
    description:
      "A self-organising network that blooms when its nodes fall into sync. Each spark is a node firing, and the core brightens as coherence rises.",
    stats: [
      { label: "Nodes", value: 18, unit: "", fill: 0.72 },
      { label: "Frequency", value: 40, unit: "Hz", fill: 0.5 },
      { label: "Coherence", value: 94, unit: "%", fill: 0.94 },
      { label: "Latency", value: 3.2, decimals: 1, unit: "ms", fill: 0.18 },
    ],
    hologram: "bloom",
  },
];

export const OBJECT_IDS = OBJECTS.map((o) => o.id);
export const isKnownObject = (id: string) => OBJECT_IDS.includes(id);
