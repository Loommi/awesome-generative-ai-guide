/** The shared catalog. Both screens preload every asset; only ids travel over the network. */
export interface ObjectSpec {
  id: string;
  name: string;
  src: string;
  /** Glow colour, as an "r, g, b" triple for rgba(). */
  accent: string;
}

export const OBJECTS: ObjectSpec[] = [
  { id: "demo-object-01", name: "Lumen Seed", src: "/objects/specimen.svg", accent: "95, 240, 220" },
  { id: "demo-object-02", name: "Aurora Shard", src: "/objects/shard.svg", accent: "180, 140, 255" },
  { id: "demo-object-03", name: "Tidal Map", src: "/objects/terrain.svg", accent: "255, 180, 84" },
  { id: "demo-object-04", name: "Signal Bloom", src: "/objects/bloom.svg", accent: "255, 120, 150" },
];

export const OBJECT_IDS = OBJECTS.map((o) => o.id);
export const isKnownObject = (id: string) => OBJECT_IDS.includes(id);
