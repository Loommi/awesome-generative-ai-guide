export interface RotState {
  rx: number;
  ry: number;
  rz: number;
}

export interface RootState extends RotState {
  px: number;
  py: number;
  pz: number;
}

export interface NeckState extends RotState {
  px: number;
  py: number;
  pz: number;
}

export function rotState(rx = 0, ry = 0, rz = 0): RotState {
  return { rx, ry, rz };
}

export function rootState(
  px = 0,
  py = 0,
  pz = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): RootState {
  return { px, py, pz, rx, ry, rz };
}

export interface LionJointState {
  root: RootState;
  body: RotState;
  neck: NeckState;
  head: RotState;
  jaw: { rx: number };
  legFL: { hip: RotState; knee: RotState; paw: RotState };
  legFR: { hip: RotState; knee: RotState; paw: RotState };
  legBL: { hip: RotState; knee: RotState; paw: RotState };
  legBR: { hip: RotState; knee: RotState; paw: RotState };
  tail: { s1: RotState; s2: RotState; s3: RotState };
  fin: { angle: number };
  emblem: { scale: number };
}

export function createLegState(): {
  hip: RotState;
  knee: RotState;
  paw: RotState;
} {
  return { hip: rotState(), knee: rotState(), paw: rotState() };
}

export function createLionJointState(): LionJointState {
  return {
    root: rootState(),
    body: rotState(),
    neck: { px: 0, py: 0.22, pz: 1.3, rx: 0, ry: 0, rz: 0 },
    head: rotState(),
    jaw: { rx: 0 },
    legFL: createLegState(),
    legFR: createLegState(),
    legBL: createLegState(),
    legBR: createLegState(),
    tail: { s1: rotState(), s2: rotState(), s3: rotState() },
    fin: { angle: 90 },
    emblem: { scale: 0 },
  };
}
