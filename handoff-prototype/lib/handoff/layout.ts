import type { DeviceRole } from "./types";
import type { Viewport } from "./trajectory";

/** Where an object rests on a screen: its centre and size in px. */
export interface Slot {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** "grid": normal resting layout. "dock": the wall's minimised strip while a module is inspected. */
export type LayoutMode = "grid" | "dock";

const ASPECT = 1.25; // objects are 4:5

/** Height of the wall's bottom dock strip while inspecting. */
export function dockHeight(vp: Viewport): number {
  return Math.round(Math.min(Math.max(vp.h * 0.2, 130), 240));
}

/** Space reserved for the header on each screen. */
export function headerHeight(vp: Viewport, role: DeviceRole): number {
  return role === "controller" ? (vp.h > vp.w ? 128 : 96) : Math.round(Math.min(Math.max(vp.h * 0.11, 72), 150));
}

/**
 * Resting slots for `count` objects. Portrait screens get a 2-column grid,
 * landscape screens a single row. In dock mode (wall only) the objects shrink
 * into a strip along the bottom edge.
 */
export function layoutSlots(count: number, vp: Viewport, role: DeviceRole, mode: LayoutMode = "grid"): Slot[] {
  if (mode === "dock") {
    const stripH = dockHeight(vp);
    const cellW = (vp.w - 32) / count;
    const h = Math.min(stripH * 0.8, (cellW * 0.5) * ASPECT);
    const w = h / ASPECT;
    return Array.from({ length: count }, (_, i) => ({ x: 16 + cellW * (i + 0.5), y: vp.h - stripH / 2, w, h }));
  }
  const top = headerHeight(vp, role);
  const bottom = role === "controller" ? 72 : Math.round(vp.h * 0.08);
  const portrait = vp.h > vp.w * 1.1;
  const cols = portrait ? Math.min(2, count) : count;
  const rows = Math.ceil(count / cols);
  const areaW = vp.w - 32;
  const areaH = vp.h - top - bottom;
  const cellW = areaW / cols;
  const cellH = areaH / rows;
  const fill = role === "display" ? 0.8 : 0.84;
  const w = Math.min(cellW * fill, (cellH * fill) / ASPECT, role === "display" ? 560 : 360);
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
