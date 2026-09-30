/**
 * PROXIMA palette. Colour carries meaning: cyan = navigation/vessel systems,
 * amber = mission data, violet = command records, red = unresolved/critical.
 * CSS mirrors these as custom properties in app/globals.css.
 */
export const THEME = {
  bg: "#080D14",
  surface: "#101A26",
  surface2: "#172331",
  text: "#E9F0F5",
  textDim: "#8295A6",
  cyan: "#63D9E8",
  amber: "#E6B66A",
  violet: "#9D8FD6",
  red: "#CD655F",
} as const;

/** "r, g, b" triple for use inside rgba(var(--accent), a). */
export function rgbTriple(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}
