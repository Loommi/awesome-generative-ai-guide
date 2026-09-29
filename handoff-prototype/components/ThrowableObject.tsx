"use client";

import { useEffect, useImperativeHandle, type CSSProperties, type Ref } from "react";
import { preload } from "react-dom";
import type { Edge } from "@/lib/handoff/gesture";
import type { Slot } from "@/lib/handoff/layout";
import type { ObjectSpec } from "@/lib/handoff/objects";
import type { ObjectHandoffEvent } from "@/lib/handoff/types";
import { useThrowable, type ObjectPhase, type ReleaseInfo, type ThrowInfo } from "@/lib/handoff/useThrowable";

/** What a screen can do to one of its objects. */
export interface ThrowableHandle {
  enter: (event: ObjectHandoffEvent, latency: number, edge: Edge) => void;
  throwOut: () => void;
  place: (present: boolean) => void;
  phase: () => ObjectPhase;
}

export function preloadObjects(objects: ObjectSpec[]) {
  for (const o of objects) preload(o.src, { as: "image", fetchPriority: "high" });
}

/** One persistent object resting in its slot. Both screens render every object from the start. */
export function ThrowableObject({
  ref,
  spec,
  slot,
  exitEdge,
  initiallyPresent,
  canThrow,
  onThrow,
  onTap,
  onRelease,
  onPhase,
  focused = false,
}: {
  ref: Ref<ThrowableHandle>;
  spec: ObjectSpec;
  slot: Slot;
  exitEdge: Edge;
  initiallyPresent: boolean;
  canThrow: () => boolean;
  onThrow: (id: string, info: ThrowInfo) => void;
  onTap?: (id: string) => void;
  onRelease?: (info: ReleaseInfo) => void;
  onPhase: (id: string, phase: ObjectPhase) => void;
  /** Hidden in place while its detail view is open. */
  focused?: boolean;
}) {
  const object = useThrowable({
    exitEdge,
    initiallyPresent,
    home: () => ({ x: slot.x, y: slot.y }),
    canThrow,
    onThrow: (info) => onThrow(spec.id, info),
    onTap: onTap && (() => onTap(spec.id)),
    onRelease,
  });
  const { enter, throwOut, place, phaseRef } = object;

  useImperativeHandle(ref, () => ({ enter, throwOut: () => throwOut(), place, phase: () => phaseRef.current }), [
    enter,
    throwOut,
    place,
    phaseRef,
  ]);

  useEffect(() => onPhase(spec.id, object.phase), [onPhase, spec.id, object.phase]);

  const style = {
    left: slot.x - slot.w / 2,
    top: slot.y - slot.h / 2,
    width: slot.w,
    height: slot.h,
    "--accent": spec.accent,
  } as CSSProperties;

  return (
    <div ref={object.ref} className="object" data-phase={object.phase} data-focused={focused} data-object-id={spec.id} style={style} {...object.handlers}>
      <div className="object-glow" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={spec.src} alt={spec.name} draggable={false} decoding="sync" />
    </div>
  );
}
