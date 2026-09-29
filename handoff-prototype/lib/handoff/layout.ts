import type { DeviceRole } from "./types";
import type { Viewport } from "./trajectory";

/** Where an object rests on a screen: its centre and size in px. */
export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

const ASPECT = 1.25; // objects are 4:5

/**
 * Resting slots for `count` objects. Portrait screens get a 2-column grid,
 * landscape screens a single row. Leaves room for the status line and hints.
 */
export function layoutSlots(count: number, vp: Viewport, role: DeviceRole): Slot[] {
  const top = role === "controller" ? 64 : 48;
  const bottom = role === "controller" ? 76 : 48;
  const portrait = vp.h > vp.w * 1.1;
  const cols = portrait ? Math.min(2, count) : count;
  const rows = Math.ceil(count / cols);
  const areaW = vp.w - 32;
  const areaH = vp.h - top - bottom;
  const cellW = areaW / cols;
  const cellH = areaH / rows;
  const fill = role === "display" ? 0.62 : 0.74;
  const w = Math.min(cellW * fill, (cellH * fill) / ASPECT, role === "display" ? 420 : 340);
  const h = w * ASPECT;
  return Array.from({ length: count }, (_, i) => {
    const r = Math.floor(i / cols);
    const inRow = Math.min(cols, count - r * cols);
    const c = i % cols;
    // Centre a short last row.
    const rowOffset = ((cols - inRow) * cellW) / 2;
    return { x: 16 + rowOffset + cellW * (c + 0.5), y: top + cellH * (r + 0.5), w, h };
  });
}
