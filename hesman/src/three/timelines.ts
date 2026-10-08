import gsap from "gsap";
import { LionId } from "@/lib/types";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";
import { assembly, PlacementTarget } from "./rig/assembly";
import { hangarLights, sceneBridge } from "./sceneBridge";
import { useHesmanStore } from "@/state/store";
import { setCurrentTimeline } from "./timelineControl";
import { beastOverview } from "./cameraPresets";

type V3 = [number, number, number];

function cam(pos: V3, target: V3) {
  return () => {
    sceneBridge.cameraControls?.setLookAt(...pos, ...target, true);
  };
}

/** Camera position relative to the combined robot, in units of its height. */
function robotCam(x: number, y: number, z: number): [V3, V3] {
  const h = assembly.metrics.height;
  return [[x * h, y * h, z * h], [0, h * 0.5, 0]];
}

function move(tl: gsap.core.Timeline, id: LionId, target: PlacementTarget, at: number, duration: number) {
  tl.call(() => assembly.beginMove(id, target), [], at);
  tl.fromTo(
    assembly.placement[id],
    { t: 0 },
    { t: 1, duration, ease: "power2.inOut", immediateRender: false },
    at,
  );
}

function morph(tl: gsap.core.Timeline, id: LionId, value: number, at: number, duration: number) {
  tl.to(assembly.rigs[id], { morph: value, duration, ease: "power1.inOut" }, at);
}

export function transformSingleLion(id: LionId, toRobot: boolean) {
  if (!assembly.ready) return null;
  const store = useHesmanStore.getState();
  const tl = gsap.timeline({
    onStart: () => store.setBusy(true),
    onComplete: () => {
      store.setTransformed(id, toRobot);
      store.setBusy(false);
      store.log(`${LION_CONFIGS[id].name.toUpperCase()} ${toRobot ? "TRANSFORMATION COMPLETE" : "REVERTED TO BEAST MODE"}`);
    },
  });
  move(tl, id, toRobot ? "stand" : "dock", toRobot ? 0 : 0.4, 2.8);
  morph(tl, id, toRobot ? 1 : 0, toRobot ? 0.2 : 0, 2.8);
  tl.to(assembly.rigs[id], { energy: toRobot ? 0.6 : 0, duration: 0.8 }, 2.2);
  setCurrentTimeline(tl);
  return tl;
}

export function playFullCombinationTimeline(onComplete?: () => void) {
  if (!assembly.ready) return null;
  const store = useHesmanStore.getState();
  const tl = gsap.timeline({
    onStart: () => {
      store.setMode("transforming");
      store.setBusy(true);
      store.log("INITIATE COMBINATION SEQUENCE");
    },
    onComplete: () => {
      store.setMode("combined");
      store.setBusy(false);
      LION_ORDER.forEach((id) => store.setTransformed(id, true));
      store.log("HESMAN ASSEMBLY COMPLETE // ALL SYSTEMS NOMINAL");
      onComplete?.();
    },
  });

  tl.to(hangarLights, { ambient: 0.45, key: 0.55, warn: 1, duration: 1.4, ease: "power2.inOut" }, 0);
  tl.call(cam(...robotCam(0, 0.95, 2.4)), [], 0);

  tl.call(() => store.log("BLACK LION // CORE CHAMBER LOCK"), [], 0.8);
  move(tl, "black", "combined", 0.8, 3.4);
  morph(tl, "black", 1, 1.0, 3.2);
  tl.call(cam(...robotCam(0.75, 0.75, 1.35)), [], 3.6);

  tl.call(() => store.log("BLUE / ORANGE // HIP DOCKING"), [], 4.4);
  (["blue", "orange"] as LionId[]).forEach((id, i) => {
    move(tl, id, "combined", 4.4 + i * 0.35, 3.4);
    morph(tl, id, 1, 4.4 + i * 0.35, 2.6);
  });
  tl.call(cam(...robotCam(-0.8, 0.4, 1.35)), [], 7.6);

  tl.call(() => store.log("RED / GREEN // SHOULDER DOCKING"), [], 8.0);
  (["red", "green"] as LionId[]).forEach((id, i) => {
    move(tl, id, "combined", 8.0 + i * 0.35, 3.4);
    morph(tl, id, 1, 8.0 + i * 0.35, 2.6);
  });

  tl.call(() => store.log("EMBLEM ONLINE // ENERGY PULSE"), [], 11.8);
  tl.to(hangarLights, { warn: 0, ambient: 1, key: 1, duration: 1.6, ease: "power2.out" }, 11.8);
  LION_ORDER.forEach((id) => tl.to(assembly.rigs[id], { energy: 1, duration: 0.9, ease: "back.out(2)" }, 11.9));
  tl.fromTo(
    hangarLights,
    { platformPulse: 0.3 },
    { platformPulse: 3.2, duration: 0.35, yoyo: true, repeat: 3, ease: "power1.inOut", immediateRender: false },
    12.0,
  );
  tl.call(cam(...robotCam(1.25, 0.65, 1.1)), [], 12.6);
  tl.call(cam(...robotCam(-1.25, 0.45, 1.15)), [], 15.4);
  tl.call(cam(...robotCam(0.55, 0.6, 1.75)), [], 18.2);
  tl.to({}, { duration: 1.2 }, 18.2);

  setCurrentTimeline(tl);
  return tl;
}

export function playDisassembleTimeline(onComplete?: () => void) {
  if (!assembly.ready) return null;
  const store = useHesmanStore.getState();
  const tl = gsap.timeline({
    onStart: () => {
      store.setMode("transforming");
      store.setBusy(true);
      store.log("DISASSEMBLY SEQUENCE INITIATED");
    },
    onComplete: () => {
      store.setMode("beast");
      store.setBusy(false);
      LION_ORDER.forEach((id) => store.setTransformed(id, false));
      store.log("ALL UNITS RETURNED TO BEAST MODE");
      onComplete?.();
    },
  });

  tl.to(hangarLights, { warn: 0.8, ambient: 0.6, duration: 1, ease: "power2.inOut" }, 0);
  tl.call(cam(...robotCam(1.0, 0.6, 1.6)), [], 0);
  LION_ORDER.forEach((id) => tl.to(assembly.rigs[id], { energy: 0, duration: 0.6 }, 0.2));

  (["red", "green"] as LionId[]).forEach((id, i) => {
    move(tl, id, "dock", 0.8 + i * 0.3, 3.2);
    morph(tl, id, 0, 1.0 + i * 0.3, 2.6);
  });
  (["blue", "orange"] as LionId[]).forEach((id, i) => {
    move(tl, id, "dock", 3.6 + i * 0.3, 3.2);
    morph(tl, id, 0, 3.8 + i * 0.3, 2.6);
  });
  move(tl, "black", "dock", 6.6, 3.2);
  morph(tl, "black", 0, 6.6, 3.0);
  tl.to(hangarLights, { ambient: 1, key: 1, warn: 0, duration: 1.6, ease: "power2.out" }, 8.6);
  tl.call(() => beastOverview(), [], 9.2);
  tl.to({}, { duration: 1 }, 9.2);

  setCurrentTimeline(tl);
  return tl;
}

export function playExplodeTimeline() {
  if (!assembly.ready) return null;
  const store = useHesmanStore.getState();
  const tl = gsap.timeline({
    onStart: () => {
      store.setMode("exploding");
      store.setBusy(true);
      store.log("EXPLODED VIEW // COMPONENT SEPARATION");
    },
    onComplete: () => {
      store.setMode("exploded");
      store.setBusy(false);
    },
  });
  (["red", "green", "blue", "orange"] as LionId[]).forEach((id, i) =>
    tl.to(assembly.explode[id], { e: 1, duration: 1.8, ease: "power3.out" }, i * 0.08),
  );
  tl.call(cam(...robotCam(0.35, 0.6, 2.25)), [], 0.1);
  setCurrentTimeline(tl);
  return tl;
}

export function playReassembleTimeline() {
  if (!assembly.ready) return null;
  const store = useHesmanStore.getState();
  const tl = gsap.timeline({
    onStart: () => {
      store.setMode("reassembling");
      store.setBusy(true);
      store.log("REASSEMBLING COMPONENTS");
    },
    onComplete: () => {
      store.setMode("combined");
      store.setBusy(false);
      store.log("ATTACHMENT POINTS LOCKED");
    },
  });
  (["red", "green", "blue", "orange"] as LionId[]).forEach((id, i) =>
    tl.to(assembly.explode[id], { e: 0, duration: 1.6, ease: "power3.inOut" }, i * 0.08),
  );
  tl.call(cam(...robotCam(0.55, 0.6, 1.75)), [], 0.1);
  setCurrentTimeline(tl);
  return tl;
}

export function resetSceneInstant() {
  const store = useHesmanStore.getState();
  gsap.killTweensOf(hangarLights);
  for (const id of LION_ORDER) {
    gsap.killTweensOf(assembly.placement[id]);
    gsap.killTweensOf(assembly.explode[id]);
    if (assembly.rigs[id]) gsap.killTweensOf(assembly.rigs[id]);
  }
  assembly.resetAll();
  hangarLights.ambient = 1;
  hangarLights.key = 1;
  hangarLights.rim = 1;
  hangarLights.warn = 0;
  hangarLights.platformPulse = 0.3;
  hangarLights.fogDensity = 1;

  store.setMode("beast");
  LION_ORDER.forEach((id) => store.setTransformed(id, false));
  store.selectUnit(null);
  store.setBusy(false);
  store.log("SCENE RESET // ALL UNITS AT DOCKING STATIONS");
  beastOverview();
}
