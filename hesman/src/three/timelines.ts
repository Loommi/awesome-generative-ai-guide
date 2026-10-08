import gsap from "gsap";
import { LionId } from "@/lib/types";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";
import {
  BEAST_POSE,
  COMBINED_ROOT,
  EXPLODE_OFFSET,
  LegJoints,
  PoseData,
  RootXform,
  dockRootXform,
  getRobotPose,
} from "./poses";
import { LionJointState } from "./jointState";
import { jointStateBag } from "./stateBag";
import { hangarLights, sceneBridge } from "./sceneBridge";
import { useHesmanStore } from "@/state/store";
import { setCurrentTimeline } from "./timelineControl";

const LEG_KEYS = ["legFL", "legFR", "legBL", "legBR"] as const;

function applyPoseTween(
  tl: gsap.core.Timeline,
  js: LionJointState,
  pose: PoseData,
  duration: number,
  at: number,
  ease = "power2.inOut",
) {
  tl.to(js.body, { rx: pose.body.rot[0], ry: pose.body.rot[1], rz: pose.body.rot[2], duration, ease }, at);
  tl.to(
    js.neck,
    {
      px: pose.neck.pos?.[0] ?? js.neck.px,
      py: pose.neck.pos?.[1] ?? js.neck.py,
      pz: pose.neck.pos?.[2] ?? js.neck.pz,
      rx: pose.neck.rot[0],
      ry: pose.neck.rot[1],
      rz: pose.neck.rot[2],
      duration,
      ease,
    },
    at,
  );
  tl.to(js.head, { rx: pose.head.rot[0], ry: pose.head.rot[1], rz: pose.head.rot[2], duration, ease }, at + 0.1);
  tl.to(js.jaw, { rx: pose.jaw, duration: duration * 0.6, ease }, at + 0.2);

  LEG_KEYS.forEach((key, i) => {
    const legState = js[key];
    const legPose: LegJoints = pose[key];
    const legAt = at + i * 0.08;
    tl.to(
      legState.hip,
      { rx: legPose.hip.rot[0], ry: legPose.hip.rot[1], rz: legPose.hip.rot[2], duration, ease },
      legAt,
    );
    tl.to(
      legState.knee,
      { rx: legPose.knee.rot[0], ry: legPose.knee.rot[1], rz: legPose.knee.rot[2], duration, ease },
      legAt + 0.1,
    );
    tl.to(
      legState.paw,
      { rx: legPose.paw.rot[0], ry: legPose.paw.rot[1], rz: legPose.paw.rot[2], duration: duration * 0.8, ease },
      legAt + 0.2,
    );
  });

  tl.to(js.tail.s1, { rx: pose.tail[0], duration, ease }, at + 0.1);
  tl.to(js.tail.s2, { rx: pose.tail[1], duration, ease }, at + 0.18);
  tl.to(js.tail.s3, { rx: pose.tail[2], duration, ease }, at + 0.26);

  tl.to(js.fin, { angle: pose === BEAST_POSE ? 90 : 18, duration, ease }, at);
}

function applyRootTween(
  tl: gsap.core.Timeline,
  js: LionJointState,
  target: RootXform,
  duration: number,
  at: number,
  ease = "power3.inOut",
) {
  tl.to(
    js.root,
    {
      px: target.pos[0],
      py: target.pos[1],
      pz: target.pos[2],
      rx: target.rot[0],
      ry: target.rot[1],
      rz: target.rot[2],
      duration,
      ease,
    },
    at,
  );
}

function camMove(pos: [number, number, number], target: [number, number, number], smooth = true) {
  return () => {
    sceneBridge.cameraControls?.setLookAt(...pos, ...target, smooth);
  };
}

export function transformSingleLion(id: LionId, toRobot: boolean) {
  const js = jointStateBag.get(id);
  if (!js) return null;
  const role = LION_CONFIGS[id].role;
  const pose = toRobot ? getRobotPose(role) : BEAST_POSE;
  const store = useHesmanStore.getState();

  const tl = gsap.timeline({
    onStart: () => store.setBusy(true),
    onComplete: () => {
      store.setTransformed(id, toRobot);
      store.setBusy(false);
      store.log(
        `${LION_CONFIGS[id].name.toUpperCase()} ${toRobot ? "TRANSFORMATION COMPLETE" : "REVERTED TO BEAST MODE"}`,
      );
    },
  });
  applyPoseTween(tl, js, pose, 2.4, 0);
  setCurrentTimeline(tl);
  return tl;
}

export function playFullCombinationTimeline(onComplete?: () => void) {
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

  tl.to(hangarLights, { ambient: 0.22, key: 0.35, warn: 1, duration: 1.4, ease: "power2.inOut" }, 0);
  tl.call(camMove([0, 7, 15], [0, 2, 0]), [], 0);

  const black = jointStateBag.get("black");
  if (black) {
    applyRootTween(tl, black, COMBINED_ROOT.black, 2.6, 1.0);
    applyPoseTween(tl, black, getRobotPose("torso"), 3.0, 1.3);
  }
  tl.call(camMove([5, 3, 9], [0, 1.6, 0]), [], 3.4);

  (["blue", "orange"] as LionId[]).forEach((id, i) => {
    const js = jointStateBag.get(id);
    if (!js) return;
    const at = 3.6 + i * 0.3;
    applyRootTween(tl, js, COMBINED_ROOT[id], 3.0, at);
    applyPoseTween(tl, js, getRobotPose(LION_CONFIGS[id].role), 3.0, at);
  });
  tl.call(camMove([-5, 3, 8], [0, 1.6, 0]), [], 7.2);

  (["red", "green"] as LionId[]).forEach((id, i) => {
    const js = jointStateBag.get(id);
    if (!js) return;
    const at = 7.4 + i * 0.3;
    applyRootTween(tl, js, COMBINED_ROOT[id], 3.0, at);
    applyPoseTween(tl, js, getRobotPose(LION_CONFIGS[id].role), 3.0, at);
  });

  tl.to(hangarLights, { warn: 0.1, ambient: 0.6, key: 0.9, duration: 1.6, ease: "power2.out" }, 11.0);
  if (black) {
    tl.to(black.emblem, { scale: 1, duration: 0.9, ease: "back.out(2.4)" }, 11.4);
  }
  tl.fromTo(
    hangarLights,
    { platformPulse: 0.3 },
    { platformPulse: 3.2, duration: 0.35, yoyo: true, repeat: 3, ease: "power1.inOut" },
    11.6,
  );
  tl.call(camMove([9, 4, 13], [0, 1.8, 0]), [], 12.5);
  tl.call(camMove([-9, 5, 11], [0, 1.8, 0]), [], 15.5);
  tl.call(camMove([0, 2.4, 11], [0, 1.8, 0]), [], 18.2);

  setCurrentTimeline(tl);
  return tl;
}

export function playDisassembleTimeline(onComplete?: () => void) {
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

  tl.to(hangarLights, { warn: 0.8, ambient: 0.4, duration: 1, ease: "power2.inOut" }, 0);
  tl.call(camMove([9, 4, 13], [0, 1.8, 0]), [], 0);

  const black = jointStateBag.get("black");
  if (black) tl.to(black.emblem, { scale: 0, duration: 0.6, ease: "power2.in" }, 0.2);

  (["red", "green"] as LionId[]).forEach((id, i) => {
    const js = jointStateBag.get(id);
    if (!js) return;
    const at = 1.0 + i * 0.3;
    applyPoseTween(tl, js, BEAST_POSE, 2.6, at);
    applyRootTween(tl, js, dockRootXform(id), 2.8, at + 0.2);
  });
  tl.call(camMove([-7, 3, 10], [0, 1.4, 0]), [], 3.6);

  (["blue", "orange"] as LionId[]).forEach((id, i) => {
    const js = jointStateBag.get(id);
    if (!js) return;
    const at = 4.4 + i * 0.3;
    applyPoseTween(tl, js, BEAST_POSE, 2.6, at);
    applyRootTween(tl, js, dockRootXform(id), 2.8, at + 0.2);
  });

  if (black) {
    const at = 7.4;
    applyPoseTween(tl, black, BEAST_POSE, 2.6, at);
    applyRootTween(tl, black, dockRootXform("black"), 2.8, at);
  }
  tl.to(hangarLights, { ambient: 1, key: 1, warn: 0, duration: 1.6, ease: "power2.out" }, 9.0);
  tl.call(camMove([0, 6, 13], [0, 1, 0]), [], 9.4);

  setCurrentTimeline(tl);
  return tl;
}

export function playExplodeTimeline() {
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
  LION_ORDER.forEach((id) => {
    const js = jointStateBag.get(id);
    if (!js) return;
    const offset = EXPLODE_OFFSET[id];
    const base = COMBINED_ROOT[id];
    applyRootTween(
      tl,
      js,
      { pos: [base.pos[0] + offset[0], base.pos[1] + offset[1], base.pos[2] + offset[2]], rot: base.rot },
      1.8,
      0,
      "power2.out",
    );
  });
  tl.call(camMove([0, 3, 16], [0, 1.4, 0]), [], 0.1);
  setCurrentTimeline(tl);
  return tl;
}

export function resetSceneInstant() {
  const store = useHesmanStore.getState();
  gsap.killTweensOf(hangarLights);
  LION_ORDER.forEach((id) => {
    const js = jointStateBag.get(id);
    if (!js) return;
    gsap.killTweensOf([
      js.body,
      js.neck,
      js.head,
      js.jaw,
      js.legFL.hip,
      js.legFL.knee,
      js.legFL.paw,
      js.legFR.hip,
      js.legFR.knee,
      js.legFR.paw,
      js.legBL.hip,
      js.legBL.knee,
      js.legBL.paw,
      js.legBR.hip,
      js.legBR.knee,
      js.legBR.paw,
      js.tail.s1,
      js.tail.s2,
      js.tail.s3,
      js.fin,
      js.emblem,
      js.root,
    ]);
    const dock = dockRootXform(id);
    js.root.px = dock.pos[0];
    js.root.py = dock.pos[1];
    js.root.pz = dock.pos[2];
    js.root.rx = dock.rot[0];
    js.root.ry = dock.rot[1];
    js.root.rz = dock.rot[2];
    const pose = BEAST_POSE;
    js.body.rx = pose.body.rot[0];
    js.body.ry = pose.body.rot[1];
    js.body.rz = pose.body.rot[2];
    js.neck.px = pose.neck.pos?.[0] ?? js.neck.px;
    js.neck.py = pose.neck.pos?.[1] ?? js.neck.py;
    js.neck.pz = pose.neck.pos?.[2] ?? js.neck.pz;
    js.neck.rx = pose.neck.rot[0];
    js.neck.ry = pose.neck.rot[1];
    js.neck.rz = pose.neck.rot[2];
    js.head.rx = pose.head.rot[0];
    js.head.ry = pose.head.rot[1];
    js.head.rz = pose.head.rot[2];
    js.jaw.rx = pose.jaw;
    LEG_KEYS.forEach((key) => {
      const legState = js[key];
      const legPose = pose[key];
      legState.hip.rx = legPose.hip.rot[0];
      legState.hip.ry = legPose.hip.rot[1];
      legState.hip.rz = legPose.hip.rot[2];
      legState.knee.rx = legPose.knee.rot[0];
      legState.knee.ry = legPose.knee.rot[1];
      legState.knee.rz = legPose.knee.rot[2];
      legState.paw.rx = legPose.paw.rot[0];
      legState.paw.ry = legPose.paw.rot[1];
      legState.paw.rz = legPose.paw.rot[2];
    });
    js.tail.s1.rx = pose.tail[0];
    js.tail.s2.rx = pose.tail[1];
    js.tail.s3.rx = pose.tail[2];
    js.fin.angle = 90;
    js.emblem.scale = 0;
  });
  hangarLights.ambient = 1;
  hangarLights.key = 1;
  hangarLights.rim = 1;
  hangarLights.warn = 0;
  hangarLights.fogDensity = 1;

  store.setMode("beast");
  LION_ORDER.forEach((id) => store.setTransformed(id, false));
  store.selectUnit(null);
  store.setBusy(false);
  store.log("SCENE RESET // ALL UNITS AT DOCKING STATIONS");
  sceneBridge.cameraControls?.setLookAt(11, 7, 17, 0, 1.3, 0, true);
}

export function playReassembleTimeline() {
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
    },
  });
  LION_ORDER.forEach((id) => {
    const js = jointStateBag.get(id);
    if (!js) return;
    applyRootTween(tl, js, COMBINED_ROOT[id], 1.8, 0, "power2.inOut");
  });
  tl.call(camMove([0, 2.4, 11], [0, 1.8, 0]), [], 0.1);
  setCurrentTimeline(tl);
  return tl;
}
