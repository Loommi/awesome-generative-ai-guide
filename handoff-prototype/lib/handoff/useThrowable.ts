"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { analyzeThrow, VelocityTracker, type Edge, type ThrowAnalysis } from "./gesture";
import { clamp, lerp, poseToTransform, REST, springHome, tween, type Pose, type Running, type Vec2Like } from "./motion";
import { halfDiagonal, planEntry, planExit } from "./trajectory";
import type { ObjectHandoffEvent } from "./types";

/** Animation state of the one persistent object on this screen. */
export type ObjectPhase = "present" | "dragging" | "settling" | "exiting" | "away" | "entering";

/** Everything the other screen needs to continue the motion. */
export interface ThrowInfo {
  direction: Vec2Like;
  velocity: number;
  velocityNorm: number;
  release: Vec2Like;
  edgeX: number;
  exitDuration: number;
}

export interface ReleaseInfo extends ThrowAnalysis {
  velocityVec: Vec2Like;
  thrown: boolean;
}

interface Options {
  /** The edge this object leaves through when thrown. */
  exitEdge: Edge;
  initiallyPresent: boolean;
  /** Gate throws (e.g. no peer connected). Invalid throws spring back. */
  canThrow?: () => boolean;
  /** Fired at release, before the exit animation, so the network event goes out immediately. */
  onThrow: (info: ThrowInfo) => void;
  onTap?: () => void;
  onRelease?: (info: ReleaseInfo) => void;
}

const TAP_MAX_MOVE = 8;
const TAP_MAX_MS = 350;
const HELD_SCALE = 1.035;

/**
 * Drag, flick, throw-out and catch-in for a single element. Motion runs on
 * requestAnimationFrame and writes transforms directly; React only sees phase changes.
 */
export function useThrowable(opts: Options) {
  const ref = useRef<HTMLDivElement>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const [phase, setPhaseState] = useState<ObjectPhase>(opts.initiallyPresent ? "present" : "away");
  const phaseRef = useRef(phase);
  const setPhase = useCallback((p: ObjectPhase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const pose = useRef<Pose>({ ...REST });
  const anim = useRef<Running | null>(null);
  const timer = useRef<number | null>(null);
  const tracker = useRef(new VelocityTracker());
  /** A throw requested while the object was still landing; runs once it settles. */
  const queuedThrow = useRef<(() => void) | null>(null);
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    origin: Pose;
    startTime: number;
    maxDist: number;
    raf: number;
  } | null>(null);

  const apply = useCallback((p: Pose) => {
    pose.current = p;
    const el = ref.current;
    if (!el) return;
    el.style.transform = poseToTransform(p);
    el.style.opacity = String(p.opacity);
  }, []);

  const setVisible = useCallback((visible: boolean) => {
    if (ref.current) ref.current.style.visibility = visible ? "visible" : "hidden";
  }, []);

  const stop = useCallback(() => {
    queuedThrow.current = null;
    anim.current?.cancel();
    anim.current = null;
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => {
    apply(pose.current);
    setVisible(phaseRef.current !== "away");
    return stop;
  }, [apply, setVisible, stop]);

  const viewport = () => ({ w: window.innerWidth, h: window.innerHeight });

  /** Animate out through the exit edge and report the throw. */
  const exit = useCallback(
    (direction: Vec2Like, speed: number): ThrowInfo | null => {
      const el = ref.current;
      if (!el) return null;
      stop();
      const vp = viewport();
      const from = { ...pose.current };
      const plan = planExit({ viewport: vp, from, halfDiag: halfDiagonal(el), direction, speed, edge: optsRef.current.exitEdge });
      const info: ThrowInfo = {
        direction,
        velocity: Math.round(speed),
        velocityNorm: speed / vp.h,
        release: { x: (vp.w / 2 + from.x) / vp.w, y: (vp.h / 2 + from.y) / vp.h },
        edgeX: plan.edgeX,
        exitDuration: Math.round(plan.duration),
      };
      optsRef.current.onThrow(info);
      setPhase("exiting");
      const run = tween(plan.duration, (t) => apply(plan.pose(t)));
      anim.current = run;
      run.done.then((finished) => {
        if (!finished) return;
        setVisible(false);
        apply({ ...REST });
        setPhase("away");
      });
      return info;
    },
    [apply, setPhase, setVisible, stop],
  );

  /** Programmatic throw (e.g. a "Return" button): a firm, straight flick. */
  const throwOut = useCallback(
    (direction?: Vec2Like, speed = 1900) => {
      const d = direction ?? { x: 0, y: optsRef.current.exitEdge === "top" ? -1 : 1 };
      if (phaseRef.current === "entering") {
        queuedThrow.current = () => exit(d, speed);
        return;
      }
      if (["present", "settling"].includes(phaseRef.current)) exit(d, speed);
    },
    [exit],
  );

  /** Catch an incoming object through `edge`, continuing the sender's trajectory. */
  const enter = useCallback(
    (event: ObjectHandoffEvent, latency: number, edge: Edge) => {
      const el = ref.current;
      if (!el) return;
      stop();
      const plan = planEntry({ viewport: viewport(), halfDiag: halfDiagonal(el), edge, event, latency });
      setPhase("entering");
      apply(plan.pose(plan.startT));
      const start = () => {
        timer.current = null;
        setVisible(true);
        const run = tween(plan.duration, (t) => apply(plan.pose(t)), plan.startT);
        anim.current = run;
        run.done.then((finished) => {
          if (!finished) return;
          apply({ ...REST });
          setPhase("present");
          const queued = queuedThrow.current;
          queuedThrow.current = null;
          queued?.();
        });
      };
      setVisible(false);
      if (plan.delay > 4) timer.current = window.setTimeout(start, plan.delay);
      else start();
    },
    [apply, setPhase, setVisible, stop],
  );

  /** Snap state without animation (used to reconcile after a reload). */
  const place = useCallback(
    (present: boolean) => {
      stop();
      apply({ ...REST });
      setVisible(present);
      setPhase(present ? "present" : "away");
    },
    [apply, setPhase, setVisible, stop],
  );

  // --- Pointer handling ---------------------------------------------------

  const dragLoop = useCallback(() => {
    const d = drag.current;
    if (!d) return;
    const v = tracker.current.velocity();
    const p = pose.current;
    // Lift slightly and lean into horizontal motion, like a held object.
    const targetRotate = clamp(v.x * 0.004, -7, 7);
    apply({
      x: d.origin.x + (d.lastX - d.startX),
      y: d.origin.y + (d.lastY - d.startY),
      scale: lerp(p.scale, HELD_SCALE, 0.25),
      rotate: lerp(p.rotate, targetRotate, 0.18),
      opacity: 1,
    });
    d.raf = requestAnimationFrame(dragLoop);
  }, [apply]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (drag.current) return;
      if (!["present", "settling"].includes(phaseRef.current)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      stop();
      e.currentTarget.setPointerCapture(e.pointerId);
      tracker.current.reset();
      tracker.current.add(e.timeStamp, e.clientX, e.clientY);
      drag.current = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        origin: { ...pose.current },
        startTime: e.timeStamp,
        maxDist: 0,
        raf: requestAnimationFrame(dragLoop),
      };
      setPhase("dragging");
    },
    [dragLoop, setPhase, stop],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const native = e.nativeEvent;
    const samples = typeof native.getCoalescedEvents === "function" ? native.getCoalescedEvents() : [];
    for (const s of samples.length ? samples : [native]) tracker.current.add(s.timeStamp, s.clientX, s.clientY);
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.maxDist = Math.max(d.maxDist, Math.hypot(e.clientX - d.startX, e.clientY - d.startY));
  }, []);

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, cancelled: boolean) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      cancelAnimationFrame(d.raf);
      drag.current = null;
      tracker.current.add(e.timeStamp, e.clientX, e.clientY);
      const v = cancelled ? { x: 0, y: 0 } : tracker.current.velocity(e.timeStamp);
      const o = optsRef.current;

      if (!cancelled && d.maxDist < TAP_MAX_MOVE && e.timeStamp - d.startTime < TAP_MAX_MS) {
        o.onTap?.();
      }

      const analysis = analyzeThrow(v, d.maxDist, o.exitEdge);
      const thrown = analysis.valid && (o.canThrow?.() ?? true);
      o.onRelease?.({ ...analysis, velocityVec: v, thrown });

      if (thrown) {
        exit(analysis.direction, analysis.speed);
        return;
      }
      // Not a throw: keep the momentum briefly, then settle home.
      const cap = 2500;
      const speed = Math.hypot(v.x, v.y);
      const k = speed > cap ? cap / speed : 1;
      setPhase("settling");
      const run = springHome(pose.current, { x: v.x * k, y: v.y * k }, apply);
      anim.current = run;
      run.done.then((finished) => finished && setPhase("present"));
    },
    [apply, exit, setPhase],
  );

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => endDrag(e, false), [endDrag]);
  const onPointerCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => endDrag(e, true), [endDrag]);

  return {
    ref,
    phase,
    phaseRef,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    throwOut,
    enter,
    place,
  };
}
