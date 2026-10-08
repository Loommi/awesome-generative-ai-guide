import gsap from "gsap";
import { useHesmanStore } from "@/state/store";

let current: gsap.core.Timeline | null = null;

export function setCurrentTimeline(tl: gsap.core.Timeline | null) {
  current = tl;
  if (tl && useHesmanStore.getState().reducedMotion) {
    tl.timeScale(35);
  }
}

export function skipCurrentTimeline() {
  if (current && !current.paused()) {
    current.timeScale(35);
  }
}

export function getCurrentTimeline() {
  return current;
}
