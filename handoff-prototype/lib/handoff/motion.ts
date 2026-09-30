/** Transform state of the handoff object, relative to its resting place at screen centre. */
export interface Pose {
  x: number;
  y: number;
  scale: number;
  rotate: number; // degrees
  opacity: number;
}

export const REST: Pose = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 };

export interface Vec2Like {
  x: number;
  y: number;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface Running {
  cancel(): void;
  done: Promise<boolean>; // resolves false if cancelled
}

/**
 * Drives `frame(t)` with t in [start, 1] over `duration` ms.
 * `start` lets a late animation begin part-way through (latency compensation).
 */
export function tween(duration: number, frame: (t: number) => void, start = 0): Running {
  let raf = 0;
  let cancelled = false;
  let resolve!: (v: boolean) => void;
  const done = new Promise<boolean>((r) => (resolve = r));
  const t0 = performance.now() - start * duration;
  const tick = (now: number) => {
    if (cancelled) return;
    const t = clamp((now - t0) / duration, 0, 1);
    frame(t);
    if (t < 1) raf = requestAnimationFrame(tick);
    else resolve(true);
  };
  frame(clamp(start, 0, 1));
  raf = requestAnimationFrame(tick);
  return {
    cancel() {
      if (cancelled) return;
      cancelled = true;
      cancelAnimationFrame(raf);
      resolve(false);
    },
    done,
  };
}

/**
 * Critically-damped-ish spring from `from` to REST, seeded with a release velocity
 * (px/s) so a dropped object keeps its momentum for a moment before settling.
 */
export function springHome(
  from: Pose,
  velocity: { x: number; y: number },
  apply: (p: Pose) => void,
  { stiffness = 260, damping = 30 } = {},
): Running {
  let raf = 0;
  let cancelled = false;
  let resolve!: (v: boolean) => void;
  const done = new Promise<boolean>((r) => (resolve = r));
  const p = { ...from };
  let vx = velocity.x, vy = velocity.y, vs = 0, vr = 0;
  let last = performance.now();
  const tick = (now: number) => {
    if (cancelled) return;
    let dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Fixed sub-steps keep the integration stable on slow frames.
    while (dt > 0) {
      const h = Math.min(dt, 1 / 240);
      dt -= h;
      vx += (-stiffness * p.x - damping * vx) * h;
      vy += (-stiffness * p.y - damping * vy) * h;
      vs += (-stiffness * (p.scale - 1) - damping * vs) * h;
      vr += (-stiffness * p.rotate - damping * vr) * h;
      p.x += vx * h; p.y += vy * h; p.scale += vs * h; p.rotate += vr * h;
    }
    p.opacity = 1;
    const settled =
      Math.abs(p.x) < 0.3 && Math.abs(p.y) < 0.3 && Math.abs(vx) < 5 && Math.abs(vy) < 5 &&
      Math.abs(p.scale - 1) < 0.001 && Math.abs(p.rotate) < 0.05;
    if (settled) {
      apply({ ...REST });
      resolve(true);
      return;
    }
    apply({ ...p });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return {
    cancel() {
      if (cancelled) return;
      cancelled = true;
      cancelAnimationFrame(raf);
      resolve(false);
    },
    done,
  };
}

export function poseToTransform(p: Pose): string {
  return `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${p.rotate.toFixed(3)}deg) scale(${p.scale.toFixed(4)})`;
}
