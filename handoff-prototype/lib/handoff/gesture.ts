import type { Vec2 } from "./types";

/** Tunables for what counts as a throw rather than a drag. */
export const THROW = {
  /** Minimum release speed, px/s. */
  minSpeed: 1000,
  /** Minimum speed component toward the target edge, px/s. */
  minEdgeSpeed: 800,
  /** How aligned with the edge normal the flick must be (0.7 ≈ within 45°). */
  minAlignment: 0.7,
  /** Ignore micro-flicks. */
  minDistance: 24,
};

interface Sample {
  t: number;
  x: number;
  y: number;
}

const WINDOW_MS = 90;
/** If the finger rested this long before lifting, it's a placement, not a throw. */
const STALE_MS = 60;

/** Estimates pointer velocity from the last ~90 ms of movement. */
export class VelocityTracker {
  private samples: Sample[] = [];

  reset() {
    this.samples = [];
  }

  add(t: number, x: number, y: number) {
    this.samples.push({ t, x, y });
    const cutoff = t - WINDOW_MS * 2;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();
  }

  /** px/s. `now` is the release time on the same clock as the samples. */
  velocity(now = performance.now()): Vec2 {
    const s = this.samples;
    if (s.length < 2) return { x: 0, y: 0 };
    const last = s[s.length - 1];
    if (now - last.t > STALE_MS) return { x: 0, y: 0 };
    // Least-squares slope over the window: robust to jittery touch samples.
    const recent = s.filter((p) => last.t - p.t <= WINDOW_MS);
    if (recent.length < 2) return { x: 0, y: 0 };
    const n = recent.length;
    let st = 0, sx = 0, sy = 0, stt = 0, stx = 0, sty = 0;
    for (const p of recent) {
      const t = (p.t - last.t) / 1000;
      st += t; sx += p.x; sy += p.y;
      stt += t * t; stx += t * p.x; sty += t * p.y;
    }
    const denom = n * stt - st * st;
    if (Math.abs(denom) < 1e-9) return { x: 0, y: 0 };
    return { x: (n * stx - st * sx) / denom, y: (n * sty - st * sy) / denom };
  }
}

export type Edge = "top" | "bottom";

export interface ThrowAnalysis {
  valid: boolean;
  speed: number;
  direction: Vec2;
  reason?: string;
}

/** Decides whether a release is a deliberate flick toward `edge`. */
export function analyzeThrow(v: Vec2, distance: number, edge: Edge): ThrowAnalysis {
  const speed = Math.hypot(v.x, v.y);
  const direction = speed > 0 ? { x: v.x / speed, y: v.y / speed } : { x: 0, y: 0 };
  const toward = edge === "top" ? -direction.y : direction.y;
  const edgeSpeed = speed * toward;
  let reason: string | undefined;
  if (distance < THROW.minDistance) reason = "too short";
  else if (speed < THROW.minSpeed) reason = "too slow";
  else if (toward < THROW.minAlignment) reason = "wrong direction";
  else if (edgeSpeed < THROW.minEdgeSpeed) reason = "too slow toward edge";
  return { valid: !reason, speed, direction, reason };
}
