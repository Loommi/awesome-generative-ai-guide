import * as THREE from "three";
import { sceneBridge } from "./sceneBridge";
import { assembly } from "./rig/assembly";
import { AppMode, CameraPresetId, LionId } from "@/lib/types";

type V3 = [number, number, number];

function frame(mode: AppMode): { focus: V3; dist: number } {
  const h = assembly.metrics.height;
  if (mode === "combined" || mode === "transforming" || mode === "reassembling") {
    return { focus: [0, h * 0.5, 0], dist: h * 2.0 };
  }
  if (mode === "exploded" || mode === "exploding") return { focus: [0, h * 0.5, 0], dist: h * 2.5 };
  return { focus: [0, 1.2, 0], dist: 19 };
}

export function applyCameraPreset(preset: CameraPresetId, mode: AppMode) {
  const c = sceneBridge.cameraControls;
  if (!c) return;
  const { focus, dist } = frame(mode);
  const [fx, fy, fz] = focus;
  switch (preset) {
    case "front":
      c.setLookAt(fx, fy + dist * 0.05, fz + dist, fx, fy, fz, true);
      break;
    case "back":
      c.setLookAt(fx, fy + dist * 0.05, fz - dist, fx, fy, fz, true);
      break;
    case "left":
      // The robot's own left is +X (it faces +Z).
      c.setLookAt(fx + dist, fy + dist * 0.05, fz, fx, fy, fz, true);
      break;
    case "right":
      c.setLookAt(fx - dist, fy + dist * 0.05, fz, fx, fy, fz, true);
      break;
    case "top":
      c.setLookAt(fx, fy + dist, fz + 0.05, fx, fy, fz, true);
      break;
    case "bottom":
      c.setLookAt(fx, fy - dist * 0.8, fz + 0.05, fx, fy, fz, true);
      break;
    case "hero":
    case "reset":
    default:
      c.setLookAt(fx + dist * 0.42, fy + dist * 0.18, fz + dist * 0.9, fx, fy, fz, true);
      break;
  }
}

export function beastOverview(smooth = true) {
  sceneBridge.cameraControls?.setLookAt(12, 8.5, 19, 0, 1.2, 0, smooth);
}

/** Three-quarter close-up of a unit at its docking station. */
export function focusUnit(id: LionId) {
  if (!assembly.ready) return;
  const { p, q } = assembly.dockPose(id);
  const scale = id === "black" ? 1.3 : 1;
  const cam = new THREE.Vector3(-4.6, 3.2, 4.4).multiplyScalar(scale).applyQuaternion(q).add(p);
  sceneBridge.cameraControls?.setLookAt(cam.x, cam.y, cam.z, p.x, p.y + 1.3 * scale, p.z, true);
}
