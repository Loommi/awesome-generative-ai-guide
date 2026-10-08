import * as THREE from "three";
import { LionId } from "@/lib/types";
import { LION_ORDER } from "@/lib/lionConfigs";
import { MANIFEST } from "./manifest";
import { LionRig, quatFromSpec } from "./lionRig";

/**
 * Where a unit is headed: its beast docking station, standing transformed at
 * that station, or its slot in the combined robot (torso pose for the Black
 * Lion, the host attachment point for the limbs).
 */
export type PlacementTarget = "dock" | "stand" | "combined";

export interface Placement {
  t: number;
  target: PlacementTarget;
  fromP: THREE.Vector3;
  fromQ: THREE.Quaternion;
}

interface Pose {
  p: THREE.Vector3;
  q: THREE.Quaternion;
}

const LIMBS: LionId[] = ["red", "green", "blue", "orange"];
const PREDOCK_AT = 0.8;
const Y_AXIS = new THREE.Vector3(0, 1, 0);

const tmpM = new THREE.Matrix4();
const tmpM2 = new THREE.Matrix4();
const tmpV = new THREE.Vector3();
const tmpS = new THREE.Vector3();
const ctrl = new THREE.Vector3();
const a = new THREE.Vector3();
const b = new THREE.Vector3();

function pose(): Pose {
  return { p: new THREE.Vector3(), q: new THREE.Quaternion() };
}

export class Assembly {
  readonly root = new THREE.Group();
  rigs = {} as Record<LionId, LionRig>;
  ready = false;
  readonly placement = {} as Record<LionId, Placement>;
  readonly explode = {} as Record<LionId, { e: number }>;
  /** Combined-robot extents, measured from the real geometry during calibration. */
  readonly metrics = { height: 8, width: 4.5 };

  private readonly dockOffset = {} as Record<LionId, THREE.Matrix4>;
  private readonly stand = {} as Record<LionId, Pose>;
  private readonly combined = pose();
  private readonly scratch = { target: pose(), pre: pose() };

  constructor() {
    this.root.name = "HesmanAssembly";
    for (const id of LION_ORDER) {
      this.placement[id] = { t: 1, target: "dock", fromP: new THREE.Vector3(), fromQ: new THREE.Quaternion() };
      this.explode[id] = { e: 0 };
    }
  }

  init(rigs: Record<LionId, LionRig>) {
    if (this.ready) {
      for (const id of LION_ORDER) this.rigs[id].root.removeFromParent();
    }
    this.rigs = rigs;
    for (const id of LION_ORDER) this.root.add(rigs[id].root);
    this.calibrate();
    this.resetAll();
    this.ready = true;
  }

  private standRotation(id: LionId) {
    const torso = quatFromSpec(MANIFEST.black.combinedRotation);
    const mount = MANIFEST[id].mount;
    return mount ? torso.multiply(quatFromSpec(mount.dockRotation)) : torso;
  }

  /** Measures docking offsets, the grounded combined pose and per-unit standing poses. */
  private calibrate() {
    const black = this.rigs.black;
    for (const id of LION_ORDER) {
      const rig = this.rigs[id];
      rig.morph = 1;
      rig.applyPose(0, false);
      rig.root.position.set(0, 0, 0);
      rig.root.quaternion.identity();
      rig.root.updateMatrixWorld(true);
    }

    for (const id of LIMBS) {
      const rig = this.rigs[id];
      const mount = MANIFEST[id].mount!;
      const mountInRoot = tmpM.copy(rig.root.matrixWorld).invert().multiply(rig.node(mount.mountNode).matrixWorld);
      this.dockOffset[id] = new THREE.Matrix4()
        .makeRotationFromQuaternion(quatFromSpec(mount.dockRotation))
        .multiply(mountInRoot.invert());
    }

    black.root.quaternion.copy(this.standRotation("black"));
    for (const id of LIMBS) {
      const rig = this.rigs[id];
      black.node(MANIFEST[id].mount!.host).add(rig.root);
      this.dockOffset[id].decompose(rig.root.position, rig.root.quaternion, rig.root.scale);
    }
    black.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(black.root);
    const c = box.getCenter(new THREE.Vector3());
    this.combined.p.set(-c.x, -box.min.y, -c.z);
    this.combined.q.copy(black.root.quaternion);
    this.metrics.height = box.max.y - box.min.y;
    this.metrics.width = box.max.x - box.min.x;
    for (const id of LIMBS) this.root.add(this.rigs[id].root);

    for (const id of LION_ORDER) {
      const rig = this.rigs[id];
      rig.root.position.set(0, 0, 0);
      rig.root.quaternion.copy(this.standRotation(id));
      rig.root.updateMatrixWorld(true);
      const sb = new THREE.Box3().setFromObject(rig.root);
      const sc = sb.getCenter(new THREE.Vector3());
      this.stand[id] = { p: new THREE.Vector3(-sc.x, -sb.min.y, -sc.z), q: rig.root.quaternion.clone() };
      rig.morph = 0;
      rig.applyPose(0, false);
    }
  }

  resetAll() {
    for (const id of LION_ORDER) {
      const rig = this.rigs[id];
      if (rig) {
        rig.morph = 0;
        rig.energy = 0;
        rig.roar = 0;
      }
      this.placement[id].target = "dock";
      this.placement[id].t = 1;
      this.explode[id].e = 0;
    }
  }

  dockPose(id: LionId, out = pose()): Pose {
    const { angleDeg, radius } = MANIFEST[id].dock;
    const theta = THREE.MathUtils.degToRad(angleDeg);
    out.p.set(Math.sin(theta) * radius, 0, Math.cos(theta) * radius);
    out.q.setFromAxisAngle(Y_AXIS, radius === 0 ? 0 : theta + Math.PI);
    return out;
  }

  private standPose(id: LionId, out: Pose): Pose {
    this.dockPose(id, out);
    const s = this.stand[id];
    out.p.add(tmpV.copy(s.p).applyQuaternion(out.q));
    out.q.multiply(s.q);
    return out;
  }

  private attachPose(id: LionId, offset: THREE.Vector3, out: Pose): Pose {
    const host = this.rigs.black.node(MANIFEST[id].mount!.host);
    tmpM.copy(host.matrixWorld)
      .multiply(tmpM2.makeTranslation(offset.x, offset.y, offset.z))
      .multiply(this.dockOffset[id]);
    tmpM.decompose(out.p, out.q, tmpS);
    return out;
  }

  /** Starts a move from the unit's current world pose; tween `placement[id].t` 0→1 afterwards. */
  beginMove(id: LionId, target: PlacementTarget) {
    const pl = this.placement[id];
    const root = this.rigs[id].root;
    root.getWorldPosition(pl.fromP);
    root.getWorldQuaternion(pl.fromQ);
    pl.target = target;
    pl.t = 0;
  }

  isDocked(id: LionId) {
    const pl = this.placement[id];
    return id !== "black" && pl.target === "combined" && pl.t >= 1 && this.explode[id].e <= 1e-4;
  }

  update(time: number, idleEnabled: boolean) {
    if (!this.ready) return;
    for (const id of LION_ORDER) {
      const pl = this.placement[id];
      this.rigs[id].applyPose(time, idleEnabled && pl.target === "dock" && pl.t >= 1);
    }
    this.place("black");
    this.rigs.black.root.updateMatrixWorld(true);
    for (const id of LIMBS) this.place(id);
  }

  private place(id: LionId) {
    const rig = this.rigs[id];
    const pl = this.placement[id];
    const mount = MANIFEST[id].mount;

    if (this.isDocked(id)) {
      const host = this.rigs.black.node(mount!.host);
      if (rig.root.parent !== host) host.attach(rig.root);
      this.dockOffset[id].decompose(rig.root.position, rig.root.quaternion, tmpS);
      return;
    }
    if (rig.root.parent !== this.root) this.root.attach(rig.root);

    const { target, pre } = this.scratch;
    let hasPre = false;
    if (pl.target === "dock") this.dockPose(id, target);
    else if (pl.target === "stand") this.standPose(id, target);
    else if (!mount) {
      target.p.copy(this.combined.p);
      target.q.copy(this.combined.q);
    } else {
      this.attachPose(id, tmpV.fromArray(mount.explode).multiplyScalar(this.explode[id].e), target);
      this.attachPose(id, tmpV.fromArray(mount.approach), pre);
      hasPre = true;
    }

    const t = pl.t;
    if (t >= 1) {
      rig.root.position.copy(target.p);
      rig.root.quaternion.copy(target.q);
      return;
    }
    if (hasPre && t > PREDOCK_AT) {
      const v = (t - PREDOCK_AT) / (1 - PREDOCK_AT);
      rig.root.position.lerpVectors(pre.p, target.p, v);
      rig.root.quaternion.copy(target.q);
      return;
    }
    const end = hasPre ? pre : target;
    const s = hasPre ? t / PREDOCK_AT : t;
    const lift = Math.min(3.5, pl.fromP.distanceTo(end.p) * 0.25);
    ctrl.lerpVectors(pl.fromP, end.p, 0.5).y += lift;
    a.lerpVectors(pl.fromP, ctrl, s);
    b.lerpVectors(ctrl, end.p, s);
    rig.root.position.lerpVectors(a, b, s);
    rig.root.quaternion.slerpQuaternions(pl.fromQ, end.q, s);
  }

  findUnit(object: THREE.Object3D | null): LionId | null {
    for (let o = object; o; o = o.parent) {
      if (o.userData.lionId) return o.userData.lionId as LionId;
    }
    return null;
  }

  worldPosition(id: LionId, node: string, out: THREE.Vector3) {
    return this.rigs[id].node(node).getWorldPosition(out);
  }

  hostPosition(id: LionId, out: THREE.Vector3) {
    return this.rigs.black.node(MANIFEST[id].mount!.host).getWorldPosition(out);
  }
}

export const assembly = new Assembly();
