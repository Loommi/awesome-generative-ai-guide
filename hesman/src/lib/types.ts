export type LionId = "black" | "red" | "green" | "blue" | "orange";

export type LionRole = "torso" | "armR" | "armL" | "legL" | "legR";

export type AppMode =
  | "intro"
  | "beast"
  | "transforming"
  | "combined"
  | "exploding"
  | "exploded"
  | "reassembling";

export interface Vec3Tuple {
  0: number;
  1: number;
  2: number;
  length: 3;
}

export interface LionConfig {
  id: LionId;
  role: LionRole;
  name: string;
  codename: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  description: string;
  robotPart: string;
  dockIndex: number;
}

export interface TelemetryState {
  structuralIntegrity: number;
  powerCoreOutput: number;
  connectionState: "docked" | "transit" | "linked" | "disconnected";
}

export type CameraPresetId =
  | "hero"
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "reset";
