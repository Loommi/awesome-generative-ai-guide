"use client";

import { useEffect, useState } from "react";
import { layoutSlots, type Slot } from "./layout";
import type { DeviceRole } from "./types";

/** Slots for this screen, recomputed on resize/rotation. Null until mounted (no window on the server). */
export function useSlots(count: number, role: DeviceRole): Slot[] | null {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  useEffect(() => {
    const update = () => setSlots(layoutSlots(count, { w: window.innerWidth, h: window.innerHeight }, role));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [count, role]);
  return slots;
}
