import type { EulerOrder } from "three";
import { LionId, LionRole } from "@/lib/types";

export type Vec3 = [number, number, number];

/** Rotation in degrees. Applied on top of the node's rest rotation from the GLB. */
export interface EulerSpec {
  x?: number;
  y?: number;
  z?: number;
  order?: EulerOrder;
}

/**
 * One articulated node. Every joint is driven by the unit's morph value
 * (0 = beast, 1 = robot); `window` stages when within the morph it moves.
 */
export interface JointSpec {
  node: string;
  window: [number, number];
  beast?: EulerSpec;
  robot?: EulerSpec;
  /** Translation from the rest position in robot mode: segment extension/retraction. */
  robotOffset?: Vec3;
  offsetWindow?: [number, number];
}

export type AttachmentName =
  | "att_shoulder_L"
  | "att_shoulder_R"
  | "att_hip_L"
  | "att_hip_R";

export interface MountSpec {
  /** Attachment node on the Black Lion this unit docks to. */
  host: AttachmentName;
  /** Node on this unit that mates with the host attachment. */
  mountNode: "mount";
  /** This unit's orientation relative to the host attachment frame when docked. */
  dockRotation: EulerSpec;
  /** Pre-dock offset (host torso frame): final approach is a straight-in slide. */
  approach: Vec3;
  /** Exploded-view offset (host torso frame). */
  explode: Vec3;
}

export interface UnitManifest {
  id: LionId;
  role: LionRole;
  asset: string;
  color: string;
  dock: { angleDeg: number; radius: number };
  joints: JointSpec[];
  idle: { tail: string[]; neck: string; jaw: string; breath: string };
  mount?: MountSpec;
  attachments?: AttachmentName[];
  /** Torso only: orientation of the Black Lion in combined mode (world frame). */
  combinedRotation?: EulerSpec;
  /** Materials whose emissive intensity follows the unit's energy level. */
  glowMaterials: string[];
  labelNode: string;
  /** Baked glTF clips shipped in the asset. None: transformation is driven by `joints`. */
  clips: string[];
}

const legFold: JointSpec[] = (["L", "R"] as const).flatMap((s) => [
  { node: `hip_F${s}`, window: [0.0, 0.32], robot: { x: 90 } },
  { node: `knee_F${s}`, window: [0.08, 0.4], robot: { x: 150 } },
  { node: `paw_F${s}`, window: [0.15, 0.45], robot: { x: 70 } },
  { node: `hip_B${s}`, window: [0.0, 0.32], robot: { x: -90 } },
  { node: `knee_B${s}`, window: [0.08, 0.4], robot: { x: -150 } },
  { node: `paw_B${s}`, window: [0.15, 0.45], robot: { x: -70 } },
]);

function tailRetract(depth: number, bend1: number, bend2: number): JointSpec[] {
  return [
    { node: "tail_1", window: [0.0, 0.25], robot: { x: -bend1 }, robotOffset: [0, 0, depth], offsetWindow: [0.2, 0.5] },
    { node: "tail_2", window: [0.0, 0.25], robot: { x: -bend2 } },
    { node: "tail_3", window: [0.0, 0.25], robot: { x: 0 } },
  ];
}

const STD_TAIL = tailRetract(1.3, 13.5, 6);

export const MANIFEST: Record<LionId, UnitManifest> = {
  black: {
    id: "black",
    role: "torso",
    asset: "/models/black-lion.glb",
    color: "#2b2e36",
    dock: { angleDeg: 0, radius: 0 },
    joints: [
      ...legFold,
      ...tailRetract(1.9, 9.5, 10),
      { node: "neck", window: [0.3, 0.62], robot: { x: -150 }, robotOffset: [0, -0.15, -0.55] },
      { node: "jaw", window: [0.3, 0.5], robot: { x: 0 } },
      { node: "ext_head", window: [0.6, 0.85], robotOffset: [0, 0, 1.5] },
      { node: "ext_collar", window: [0.72, 0.88], robotOffset: [0, -0.2, 0.08] },
      { node: "ext_emblem", window: [0.8, 0.95], robotOffset: [0, -0.16, 0] },
      { node: "fin_L", window: [0.78, 1.0], robot: { x: 20, y: -155, order: "YXZ" } },
      { node: "fin_R", window: [0.78, 1.0], robot: { x: 20, y: 155, order: "YXZ" } },
    ],
    idle: { tail: ["tail_1", "tail_2", "tail_3"], neck: "neck", jaw: "jaw", breath: "body" },
    attachments: ["att_shoulder_L", "att_shoulder_R", "att_hip_L", "att_hip_R"],
    combinedRotation: { x: -90 },
    glowMaterials: ["glow_eye", "glow_emblem"],
    labelNode: "body",
    clips: [],
  },
  red: {
    id: "red",
    role: "armR",
    asset: "/models/red-lion.glb",
    color: "#c8161d",
    dock: { angleDeg: -55, radius: 8.8 },
    joints: [
      ...legFold,
      ...STD_TAIL,
      { node: "neck", window: [0.35, 0.7], robot: { y: -90, z: -90, order: "YZX" } },
      { node: "jaw", window: [0.5, 0.75], robot: { x: 14 } },
      { node: "ext_fist", window: [0.6, 0.9], robotOffset: [0, 0, -1.2] },
    ],
    idle: { tail: ["tail_1", "tail_2", "tail_3"], neck: "neck", jaw: "jaw", breath: "body" },
    mount: {
      host: "att_shoulder_R",
      mountNode: "mount",
      dockRotation: { z: 90 },
      approach: [-1.6, 0, 0.3],
      explode: [-2.8, -0.6, 0.5],
    },
    glowMaterials: ["glow_eye"],
    labelNode: "body",
    clips: [],
  },
  green: {
    id: "green",
    role: "armL",
    asset: "/models/green-lion.glb",
    color: "#15913b",
    dock: { angleDeg: 55, radius: 8.8 },
    joints: [
      ...legFold,
      ...STD_TAIL,
      { node: "neck", window: [0.35, 0.7], robot: { y: 90, z: 90, order: "YZX" } },
      { node: "jaw", window: [0.5, 0.75], robot: { x: 14 } },
      { node: "ext_fist", window: [0.6, 0.9], robotOffset: [0, 0, -1.2] },
    ],
    idle: { tail: ["tail_1", "tail_2", "tail_3"], neck: "neck", jaw: "jaw", breath: "body" },
    mount: {
      host: "att_shoulder_L",
      mountNode: "mount",
      dockRotation: { z: -90 },
      approach: [1.6, 0, 0.3],
      explode: [2.8, -0.6, 0.5],
    },
    glowMaterials: ["glow_eye"],
    labelNode: "body",
    clips: [],
  },
  blue: {
    id: "blue",
    role: "legL",
    asset: "/models/blue-lion.glb",
    color: "#1658c8",
    dock: { angleDeg: 125, radius: 8.8 },
    joints: [
      ...legFold,
      ...STD_TAIL,
      { node: "neck", window: [0.35, 0.7], robot: { x: -90 } },
      { node: "jaw", window: [0.55, 0.8], robot: { x: 24 } },
      { node: "robot_knee", window: [0.6, 0.9], robot: { x: 0 } },
      { node: "ext_thigh", window: [0.55, 0.9], robotOffset: [0, 0, -1.25] },
    ],
    idle: { tail: ["tail_1", "tail_2", "tail_3"], neck: "neck", jaw: "jaw", breath: "body" },
    mount: {
      host: "att_hip_L",
      mountNode: "mount",
      dockRotation: { x: 180 },
      approach: [0.4, 0, -1.6],
      explode: [2.0, -1.4, 0],
    },
    glowMaterials: ["glow_eye"],
    labelNode: "body",
    clips: [],
  },
  orange: {
    id: "orange",
    role: "legR",
    asset: "/models/orange-lion.glb",
    color: "#f28a12",
    dock: { angleDeg: -125, radius: 8.8 },
    joints: [
      ...legFold,
      ...STD_TAIL,
      { node: "neck", window: [0.35, 0.7], robot: { x: -90 } },
      { node: "jaw", window: [0.55, 0.8], robot: { x: 24 } },
      { node: "robot_knee", window: [0.6, 0.9], robot: { x: 0 } },
      { node: "ext_thigh", window: [0.55, 0.9], robotOffset: [0, 0, -1.25] },
    ],
    idle: { tail: ["tail_1", "tail_2", "tail_3"], neck: "neck", jaw: "jaw", breath: "body" },
    mount: {
      host: "att_hip_R",
      mountNode: "mount",
      dockRotation: { x: 180 },
      approach: [-0.4, 0, -1.6],
      explode: [-2.0, -1.4, 0],
    },
    glowMaterials: ["glow_eye"],
    labelNode: "body",
    clips: [],
  },
};

/** Joint and attachment names every asset must provide, per role. */
export const REQUIRED_NODES: Record<LionRole, string[]> = {
  torso: ["ext_head", "ext_emblem", "ext_collar", "fin_L", "fin_R", "att_shoulder_L", "att_shoulder_R", "att_hip_L", "att_hip_R"],
  armR: ["ext_fist", "mount"],
  armL: ["ext_fist", "mount"],
  legL: ["robot_knee", "ext_thigh", "mount"],
  legR: ["robot_knee", "ext_thigh", "mount"],
};
