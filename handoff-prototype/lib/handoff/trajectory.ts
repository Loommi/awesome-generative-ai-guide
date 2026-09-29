import type { Edge } from "./gesture";
import { clamp, lerp, type Pose, type Vec2Like } from "./motion";
import type { ObjectHandoffEvent } from "./types";

/**
 * Turns gesture data into motion on each screen. The outgoing path and the
 * incoming path share direction, horizontal position and energy, so the two
 * animations read as one continuous flight across the gap between screens.
 */

export interface Viewport {
  w: number;
  h: number;
}

/** An object's resting position (its slot centre) in viewport px. Poses are offsets from it. */
export interface Home {
  x: number;
  y: number;
}

/** Half the object's diagonal: how far past an edge its centre must travel to be fully gone. */
export function halfDiagonal(el: HTMLElement): number {
  return Math.hypot(el.offsetWidth, el.offsetHeight) / 2;
}

/** 0 = barely a flick, 1 = a hard throw. Based on viewport-heights per second. */
export function energy(velocityNorm: number): number {
  return clamp((velocityNorm - 1) / 2.5, 0, 1);
}

/** "Air time" (ms) between leaving one screen and appearing on the other. */
export function airGap(speed: number): number {
  return clamp(80000 / Math.max(speed, 600), 25, 80);
}

export interface ExitPlan {
  duration: number;
  /** Where the centre crosses the edge, 0..1. */
  edgeX: number;
  pose(t: number): Pose;
}

export function planExit(opts: {
  viewport: Viewport;
  home: Home;
  from: Pose;
  halfDiag: number;
  direction: Vec2Like;
  speed: number;
  edge: Edge;
}): ExitPlan {
  const { viewport: vp, home, from, halfDiag, direction: d, edge } = opts;
  const speed = Math.max(opts.speed, 600);
  const endScale = 0.84;
  const cx0 = home.x + from.x;
  const cy0 = home.y + from.y;
  const toward = Math.max(0.2, edge === "top" ? -d.y : d.y);

  // Vertical distance for the centre to reach the edge, and to be fully past it.
  const toEdge = edge === "top" ? cy0 : vp.h - cy0;
  const beyond = toEdge + halfDiag * endScale + 24;
  const length = beyond / toward;

  // Shorter than coasting at release speed, so the object accelerates away.
  const duration = clamp((length / speed) * 1000 * 0.75, 140, 250);
  const a = Math.min(1, (speed * duration) / 1000 / length); // normalized start velocity
  const edgeX = clamp((cx0 + d.x * (toEdge / toward)) / vp.w, 0, 1);

  return {
    duration,
    edgeX,
    pose(t) {
      const s = a * t + (1 - a) * t * t; // starts at release speed, then accelerates
      return {
        x: from.x + d.x * length * s,
        y: from.y + d.y * length * s,
        scale: lerp(from.scale, endScale, t * t),
        rotate: from.rotate + d.x * 10 * t,
        opacity: 1,
      };
    },
  };
}

export interface EntryPlan {
  duration: number;
  /** Wait this long before starting (the object is still "in the air"). */
  delay: number;
  /** Start part-way through when the event arrived late. */
  startT: number;
  pose(t: number): Pose;
}

export function planEntry(opts: {
  viewport: Viewport;
  /** Where the object settles on this screen. */
  home: Home;
  halfDiag: number;
  /** Edge of *this* screen the object comes in through. */
  edge: Edge;
  event: Pick<ObjectHandoffEvent, "direction" | "velocityNorm" | "edgeX" | "exitDuration" | "velocity">;
  latency: number;
}): EntryPlan {
  const { viewport: vp, home, halfDiag, edge, event, latency } = opts;
  const n = energy(event.velocityNorm);

  // Keep the incoming angle, but not so steep that it misses the screen.
  let dx = clamp(event.direction.x, -0.5, 0.5);
  let dy = edge === "bottom" ? -1 : 1;
  const len = Math.hypot(dx, 1);
  dx /= len;
  dy /= len;

  const startScale = 0.82;
  const reach = halfDiag * startScale + 8;
  // Enter where the throw crossed the sender's edge, pulled a little toward
  // this object's own slot so the curve into it stays short.
  const entryX = lerp(vp.w * (0.5 + (event.edgeX - 0.5) * 0.85), home.x, 0.3);
  const edgeY = edge === "bottom" ? vp.h + reach : -reach;
  // Harder throws start further back so they carry more speed onto the screen.
  const back = lerp(10, 140, n);
  const S = { x: entryX - dx * back, y: edgeY - dy * back };
  const C = { x: home.x, y: home.y };
  // Control point along the incoming direction: the path starts tangent to the
  // throw and bends toward the object's slot.
  const k = (Math.abs(C.y - S.y) * 0.6) / Math.abs(dy);
  const P = { x: S.x + dx * k, y: S.y + dy * k };

  const duration = lerp(400, 270, n);
  const p = lerp(1.9, 2.8, n); // sharper initial speed, stronger deceleration
  const overshoot = lerp(0, 0.03, n);
  const r0 = clamp(dx * 16, -9, 9);

  // When the object "should" appear here, measured from the release on the other screen.
  const scheduled = event.exitDuration * 0.85 + airGap(event.velocity);
  const late = latency - scheduled;

  return {
    duration,
    delay: late < 0 ? -late : 0,
    startT: late > 0 ? clamp(late / duration, 0, 0.45) : 0,
    pose(t) {
      const base = 1 - Math.pow(1 - t, p);
      const s = base + overshoot * Math.sin(Math.PI * t) * t * t;
      const u = 1 - s;
      const x = u * u * S.x + 2 * u * s * P.x + s * s * C.x;
      const y = u * u * S.y + 2 * u * s * P.y + s * s * C.y;
      return {
        x: x - C.x,
        y: y - C.y,
        scale: lerp(startScale, 1, 1 - Math.pow(1 - t, 3)),
        rotate: r0 * (1 - base),
        opacity: 1,
      };
    },
  };
}
