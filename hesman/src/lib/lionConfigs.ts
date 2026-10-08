import { LionConfig, LionId } from "./types";

export const LION_CONFIGS: Record<LionId, LionConfig> = {
  black: {
    id: "black",
    role: "torso",
    name: "Black Lion",
    codename: "UNIT-01 / VANGUARD",
    colorPrimary: "#0b0c10",
    colorSecondary: "#d4af37",
    colorAccent: "#22d3ee",
    description:
      "Command unit. Forms the torso and head of HESMAN. Houses the primary fusion core and neural uplink.",
    robotPart: "Torso & Head",
    dockIndex: 0,
  },
  red: {
    id: "red",
    role: "armR",
    name: "Red Lion",
    codename: "UNIT-02 / BLAZE",
    colorPrimary: "#b31217",
    colorSecondary: "#2a0a0a",
    colorAccent: "#ff6b57",
    description:
      "High-output offensive unit. Forms HESMAN's right arm, trading mobility for raw striking force.",
    robotPart: "Right Arm",
    dockIndex: 1,
  },
  green: {
    id: "green",
    role: "armL",
    name: "Green Lion",
    codename: "UNIT-03 / VERDANT",
    colorPrimary: "#157a36",
    colorSecondary: "#0a2a14",
    colorAccent: "#5df0a0",
    description:
      "Precision tactical unit. Forms HESMAN's left arm, specialized in fine manipulation and shielding.",
    robotPart: "Left Arm",
    dockIndex: 2,
  },
  blue: {
    id: "blue",
    role: "legL",
    name: "Blue Lion",
    codename: "UNIT-04 / FATHOM",
    colorPrimary: "#1760c4",
    colorSecondary: "#0a1a2a",
    colorAccent: "#60d4ff",
    description:
      "Stabilization unit. Forms HESMAN's left leg, providing balance and amphibious terrain handling.",
    robotPart: "Left Leg",
    dockIndex: 3,
  },
  orange: {
    id: "orange",
    role: "legR",
    name: "Orange Lion",
    codename: "UNIT-05 / EMBER",
    colorPrimary: "#e8821e",
    colorSecondary: "#2a1605",
    colorAccent: "#ffc062",
    description:
      "Propulsion unit. Forms HESMAN's right leg, delivering thrust-assisted mobility and jump capability.",
    robotPart: "Right Leg",
    dockIndex: 4,
  },
};

export const LION_ORDER: LionId[] = ["black", "red", "green", "blue", "orange"];
