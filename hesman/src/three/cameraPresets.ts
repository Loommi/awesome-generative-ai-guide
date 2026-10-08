import { sceneBridge } from "./sceneBridge";
import { CameraPresetId } from "@/lib/types";

export type Vec3 = [number, number, number];

export function applyCameraPreset(preset: CameraPresetId, focus: Vec3 = [0, 1.6, 0], dist = 11) {
  const c = sceneBridge.cameraControls;
  if (!c) return;
  const [fx, fy, fz] = focus;
  switch (preset) {
    case "front":
      c.setLookAt(fx, fy + 0.4, fz + dist, fx, fy, fz, true);
      break;
    case "back":
      c.setLookAt(fx, fy + 0.4, fz - dist, fx, fy, fz, true);
      break;
    case "left":
      c.setLookAt(fx - dist, fy + 0.4, fz, fx, fy, fz, true);
      break;
    case "right":
      c.setLookAt(fx + dist, fy + 0.4, fz, fx, fy, fz, true);
      break;
    case "top":
      c.setLookAt(fx, fy + dist, fz + 0.05, fx, fy, fz, true);
      break;
    case "bottom":
      c.setLookAt(fx, fy - dist * 0.85, fz + 0.05, fx, fy, fz, true);
      break;
    case "hero":
    case "reset":
    default:
      c.setLookAt(fx + dist * 0.72, fy + dist * 0.48, fz + dist * 0.92, fx, fy, fz, true);
      break;
  }
}
