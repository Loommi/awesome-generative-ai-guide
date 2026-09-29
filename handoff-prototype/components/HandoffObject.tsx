"use client";

import type { HTMLAttributes, Ref } from "react";
import { preload } from "react-dom";
import { OBJECT_ID } from "@/lib/handoff/types";
import type { ObjectPhase } from "@/lib/handoff/useThrowable";

export const OBJECT_SRC = "/objects/specimen.svg";

/** The one persistent object. Both screens render the same asset from the start. */
export function HandoffObject({
  ref,
  phase,
  ...handlers
}: { ref: Ref<HTMLDivElement>; phase: ObjectPhase } & HTMLAttributes<HTMLDivElement>) {
  preload(OBJECT_SRC, { as: "image", fetchPriority: "high" });
  return (
    <div ref={ref} className="object" data-phase={phase} data-object-id={OBJECT_ID} {...handlers}>
      <div className="object-glow" aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={OBJECT_SRC} alt="Lumen Seed specimen" draggable={false} decoding="sync" />
    </div>
  );
}
