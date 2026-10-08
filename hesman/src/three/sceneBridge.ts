import type CameraControls from "camera-controls";

export interface HangarLights {
  ambient: number;
  key: number;
  rim: number;
  warn: number;
  platformPulse: number;
  fogDensity: number;
}

export const hangarLights: HangarLights = {
  ambient: 1,
  key: 1,
  rim: 1,
  warn: 0,
  platformPulse: 0.3,
  fogDensity: 1,
};

export interface SceneBridge {
  cameraControls: CameraControls | null;
}

export const sceneBridge: SceneBridge = {
  cameraControls: null,
};
