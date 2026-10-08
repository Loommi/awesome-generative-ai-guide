import { LionId, LionRole } from "@/lib/types";

export type Vec3 = [number, number, number];

export interface JointXform {
  pos?: Vec3;
  rot: Vec3;
}

export interface LegJoints {
  hip: JointXform;
  knee: JointXform;
  paw: JointXform;
}

export interface PoseData {
  body: JointXform;
  neck: JointXform;
  head: JointXform;
  jaw: number;
  legFL: LegJoints;
  legFR: LegJoints;
  legBL: LegJoints;
  legBR: LegJoints;
  tail: Vec3;
  earFold: number;
}

export interface RootXform {
  pos: Vec3;
  rot: Vec3;
}

const DEG = Math.PI / 180;

export const BEAST_POSE: PoseData = {
  body: { pos: [0, 0.9, 0], rot: [0, 0, 0] },
  neck: { pos: [0, 0.22, 1.3], rot: [8 * DEG, 0, 0] },
  head: { pos: [0, 0, 0], rot: [0, 0, 0] },
  jaw: 6 * DEG,
  legFL: {
    hip: { pos: [0.68, 0.55, 0.85], rot: [10 * DEG, 0, 8 * DEG] },
    knee: { rot: [28 * DEG, 0, 0] },
    paw: { rot: [-8 * DEG, 0, 0] },
  },
  legFR: {
    hip: { pos: [-0.68, 0.55, 0.85], rot: [10 * DEG, 0, -8 * DEG] },
    knee: { rot: [28 * DEG, 0, 0] },
    paw: { rot: [-8 * DEG, 0, 0] },
  },
  legBL: {
    hip: { pos: [0.68, 0.55, -0.85], rot: [-10 * DEG, 0, 6 * DEG] },
    knee: { rot: [-32 * DEG, 0, 0] },
    paw: { rot: [10 * DEG, 0, 0] },
  },
  legBR: {
    hip: { pos: [-0.68, 0.55, -0.85], rot: [-10 * DEG, 0, -6 * DEG] },
    knee: { rot: [-32 * DEG, 0, 0] },
    paw: { rot: [10 * DEG, 0, 0] },
  },
  tail: [18 * DEG, 24 * DEG, 20 * DEG],
  earFold: 0,
};

function torsoRobotPose(): PoseData {
  return {
    body: { pos: [0, 0.9, 0], rot: [-90 * DEG, 0, 0] },
    neck: { pos: [0, 0.95, 0.35], rot: [-92 * DEG, 0, 0] },
    head: { pos: [0, 0, 0], rot: [0, 0, 0] },
    jaw: 2 * DEG,
    legFL: {
      hip: { pos: [0.68, 0.55, 0.85], rot: [100 * DEG, -20 * DEG, 70 * DEG] },
      knee: { rot: [-110 * DEG, 0, 0] },
      paw: { rot: [40 * DEG, 0, 0] },
    },
    legFR: {
      hip: { pos: [-0.68, 0.55, 0.85], rot: [100 * DEG, 20 * DEG, -70 * DEG] },
      knee: { rot: [-110 * DEG, 0, 0] },
      paw: { rot: [40 * DEG, 0, 0] },
    },
    legBL: {
      hip: { pos: [0.68, 0.55, -0.85], rot: [-95 * DEG, 15 * DEG, 60 * DEG] },
      knee: { rot: [100 * DEG, 0, 0] },
      paw: { rot: [-30 * DEG, 0, 0] },
    },
    legBR: {
      hip: { pos: [-0.68, 0.55, -0.85], rot: [-95 * DEG, -15 * DEG, -60 * DEG] },
      knee: { rot: [100 * DEG, 0, 0] },
      paw: { rot: [-30 * DEG, 0, 0] },
    },
    tail: [150 * DEG, 40 * DEG, 10 * DEG],
    earFold: 0,
  };
}

function armRobotPose(mirror: number): PoseData {
  return {
    body: { pos: [0, 0.9, 0], rot: [0, 0, mirror * 92 * DEG] },
    neck: { pos: [0, -0.1, 1.25], rot: [0, mirror * -90 * DEG, 0] },
    head: { pos: [0, 0, 0], rot: [0, 0, 0] },
    jaw: 4 * DEG,
    legFL: {
      hip: { pos: [0.68, 0.55, 0.85], rot: [-80 * DEG, 0, mirror * -75 * DEG] },
      knee: { rot: [10 * DEG, 0, 0] },
      paw: { rot: [-90 * DEG, mirror * 25 * DEG, 0] },
    },
    legFR: {
      hip: { pos: [-0.68, 0.55, 0.85], rot: [-80 * DEG, 0, mirror * -75 * DEG] },
      knee: { rot: [10 * DEG, 0, 0] },
      paw: { rot: [-90 * DEG, mirror * -25 * DEG, 0] },
    },
    legBL: {
      hip: { pos: [0.68, 0.55, -0.85], rot: [90 * DEG, 0, mirror * 80 * DEG] },
      knee: { rot: [-100 * DEG, 0, 0] },
      paw: { rot: [20 * DEG, 0, 0] },
    },
    legBR: {
      hip: { pos: [-0.68, 0.55, -0.85], rot: [90 * DEG, 0, mirror * 80 * DEG] },
      knee: { rot: [-100 * DEG, 0, 0] },
      paw: { rot: [20 * DEG, 0, 0] },
    },
    tail: [160 * DEG, 20 * DEG, 10 * DEG],
    earFold: 0.4,
  };
}

function legRobotPose(mirror: number): PoseData {
  return {
    body: { pos: [0, 0.9, 0], rot: [0, 0, 90 * DEG] },
    neck: { pos: [0, -0.2, 1.35], rot: [-10 * DEG, 0, 0] },
    head: { pos: [0, 0, 0], rot: [100 * DEG, 0, 0] },
    jaw: 22 * DEG,
    legFL: {
      hip: { pos: [0.68, 0.55, 0.85], rot: [-90 * DEG, 0, mirror * -65 * DEG] },
      knee: { rot: [100 * DEG, 0, 0] },
      paw: { rot: [-10 * DEG, 0, 0] },
    },
    legFR: {
      hip: { pos: [-0.68, 0.55, 0.85], rot: [-90 * DEG, 0, mirror * -65 * DEG] },
      knee: { rot: [100 * DEG, 0, 0] },
      paw: { rot: [-10 * DEG, 0, 0] },
    },
    legBL: {
      hip: { pos: [0.68, 0.55, -0.85], rot: [95 * DEG, 0, mirror * 70 * DEG] },
      knee: { rot: [-105 * DEG, 0, 0] },
      paw: { rot: [15 * DEG, 0, 0] },
    },
    legBR: {
      hip: { pos: [-0.68, 0.55, -0.85], rot: [95 * DEG, 0, mirror * 70 * DEG] },
      knee: { rot: [-105 * DEG, 0, 0] },
      paw: { rot: [15 * DEG, 0, 0] },
    },
    tail: [170 * DEG, 10 * DEG, 5 * DEG],
    earFold: 1,
  };
}

export function getRobotPose(role: LionRole): PoseData {
  switch (role) {
    case "torso":
      return torsoRobotPose();
    case "armR":
      return armRobotPose(1);
    case "armL":
      return armRobotPose(-1);
    case "legL":
      return legRobotPose(-1);
    case "legR":
      return legRobotPose(1);
  }
}

export const DOCK_LAYOUT: Record<LionId, { angleDeg: number; radius: number }> = {
  black: { angleDeg: 0, radius: 0 },
  red: { angleDeg: 55, radius: 8.6 },
  green: { angleDeg: -55, radius: 8.6 },
  blue: { angleDeg: -135, radius: 8.6 },
  orange: { angleDeg: 135, radius: 8.6 },
};

export function dockRootXform(id: LionId): RootXform {
  const { angleDeg, radius } = DOCK_LAYOUT[id];
  if (radius === 0) return { pos: [0, 0, 0], rot: [0, 0, 0] };
  const theta = angleDeg * DEG;
  const x = Math.sin(theta) * radius;
  const z = Math.cos(theta) * radius;
  return { pos: [x, 0, z], rot: [0, theta + Math.PI, 0] };
}

export const COMBINED_ROOT: Record<LionId, RootXform> = {
  black: { pos: [0, 1.95, 0], rot: [0, 0, 0] },
  red: { pos: [1.5, 2.55, 0.05], rot: [0, 0, -8 * DEG] },
  green: { pos: [-1.5, 2.55, 0.05], rot: [0, 0, 8 * DEG] },
  blue: { pos: [-0.62, 0.0, 0.05], rot: [0, 0, 0] },
  orange: { pos: [0.62, 0.0, 0.05], rot: [0, 0, 0] },
};

export const EXPLODE_OFFSET: Record<LionId, Vec3> = {
  black: [0, 0, 0],
  red: [3.4, 0.9, 0.4],
  green: [-3.4, 0.9, 0.4],
  blue: [-2.3, -2.8, 0.6],
  orange: [2.3, -2.8, 0.6],
};

export const LION_SCALE: Record<LionId, number> = {
  black: 1.18,
  red: 1,
  green: 1,
  blue: 1,
  orange: 1,
};
