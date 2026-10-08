import * as THREE from "three";
import { EulerSpec, REQUIRED_NODES, UnitManifest } from "./manifest";

const DEG = Math.PI / 180;

export function quatFromSpec(e?: EulerSpec): THREE.Quaternion {
  return new THREE.Quaternion().setFromEuler(
    new THREE.Euler((e?.x ?? 0) * DEG, (e?.y ?? 0) * DEG, (e?.z ?? 0) * DEG, e?.order ?? "XYZ"),
  );
}

interface Joint {
  node: THREE.Object3D;
  restQ: THREE.Quaternion;
  restP: THREE.Vector3;
  beastQ: THREE.Quaternion;
  robotQ: THREE.Quaternion;
  offset: THREE.Vector3 | null;
  window: [number, number];
  offsetWindow: [number, number];
}

interface Glow {
  material: THREE.MeshStandardMaterial;
  base: number;
  emblem: boolean;
}

function stage(m: number, [a, b]: [number, number]) {
  const t = THREE.MathUtils.clamp((m - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

export type RigSource = "glb" | "procedural";

export class LionRig {
  readonly nodes = new Map<string, THREE.Object3D>();
  private readonly joints: Joint[] = [];
  private readonly glow: Glow[] = [];
  private readonly highlightable: { material: THREE.MeshStandardMaterial; emissive: THREE.Color }[] = [];
  private readonly phase: number;

  /** 0 = beast, 1 = robot. Tweened by the timelines. */
  morph = 0;
  /** Emissive energy of eyes and emblem, 0..1. */
  energy = 0;
  /** Short head-raise / jaw-open reaction when selected. */
  roar = 0;
  highlight = 0;

  constructor(
    readonly manifest: UnitManifest,
    readonly root: THREE.Object3D,
    readonly source: RigSource,
  ) {
    root.name = "root";
    root.userData.lionId = manifest.id;
    root.traverse((o) => {
      if (o.name && !this.nodes.has(o.name)) this.nodes.set(o.name, o);
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    const missing = this.missingNodes();
    if (missing.length) throw new Error(`${manifest.id}: missing nodes ${missing.join(", ")}`);

    for (const spec of manifest.joints) {
      const node = this.nodes.get(spec.node)!;
      this.joints.push({
        node,
        restQ: node.quaternion.clone(),
        restP: node.position.clone(),
        beastQ: quatFromSpec(spec.beast),
        robotQ: quatFromSpec(spec.robot ?? spec.beast),
        offset: spec.robotOffset ? new THREE.Vector3(...spec.robotOffset) : null,
        window: spec.window,
        offsetWindow: spec.offsetWindow ?? spec.window,
      });
    }

    const seen = new Set<THREE.Material>();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (seen.has(mat) || !(mat as THREE.MeshStandardMaterial).isMeshStandardMaterial) continue;
        seen.add(mat);
        const std = mat as THREE.MeshStandardMaterial;
        if (manifest.glowMaterials.includes(std.name)) {
          this.glow.push({ material: std, base: std.emissiveIntensity || 1, emblem: std.name === "glow_emblem" });
        } else {
          this.highlightable.push({ material: std, emissive: std.emissive.clone() });
        }
      }
    });
    this.phase = manifest.id.charCodeAt(0) * 0.37;
  }

  missingNodes(): string[] {
    const need = [
      "root", "body", "neck", "head", "jaw", "tail_1", "tail_2", "tail_3",
      ...["FL", "FR", "BL", "BR"].flatMap((k) => [`hip_${k}`, `knee_${k}`, `paw_${k}`]),
      ...REQUIRED_NODES[this.manifest.role],
    ];
    return need.filter((n) => n !== "root" && !this.nodes.has(n));
  }

  node(name: string): THREE.Object3D {
    const n = this.nodes.get(name);
    if (!n) throw new Error(`${this.manifest.id}: no node ${name}`);
    return n;
  }

  /** Writes every joint's local transform for the current morph, plus idle motion. */
  applyPose(time: number, idleEnabled: boolean) {
    const m = this.morph;
    for (const j of this.joints) {
      tmpQ.slerpQuaternions(j.beastQ, j.robotQ, stage(m, j.window));
      j.node.quaternion.copy(j.restQ).multiply(tmpQ);
      j.node.position.copy(j.restP);
      if (j.offset) j.node.position.addScaledVector(j.offset, stage(m, j.offsetWindow));
    }

    const idle = idleEnabled ? 1 - THREE.MathUtils.clamp(m * 4, 0, 1) : 0;
    const { tail, neck, jaw, breath } = this.manifest.idle;
    const t = time + this.phase;
    if (idle > 0) {
      tail.forEach((name, i) => {
        tmpE.set(Math.sin(t * 1.1 - i * 0.5) * 0.05 * idle, Math.sin(t * 0.9 - i * 0.6) * 0.16 * idle, 0);
        this.node(name).quaternion.multiply(tmpQ.setFromEuler(tmpE));
      });
    }
    this.node(breath).scale.set(1, 1 + Math.sin(t * 1.6) * 0.012 * idle, 1);
    const look = Math.sin(t * 0.55) * 0.05 * idle - this.roar * 0.3;
    if (look) this.node(neck).quaternion.multiply(tmpQ.setFromEuler(tmpE.set(look, Math.sin(t * 0.35) * 0.08 * idle, 0)));
    const chomp = Math.pow(Math.max(0, Math.sin(t * 0.4)), 12) * 0.25 * idle + this.roar * 0.55;
    if (chomp) this.node(jaw).quaternion.multiply(tmpQ.setFromEuler(tmpE.set(chomp, 0, 0)));

    for (const g of this.glow) {
      g.material.emissiveIntensity = g.emblem
        ? g.base * (0.35 + this.energy * 5 + Math.sin(time * 3) * 0.4 * this.energy)
        : g.base * (0.7 + this.energy * 0.8);
    }
    const h = this.highlight * (0.6 + Math.sin(time * 4) * 0.4);
    for (const { material, emissive } of this.highlightable) {
      material.emissive.copy(emissive).lerp(HIGHLIGHT, h * 0.06);
    }
  }
}

const HIGHLIGHT = new THREE.Color("#38d6ff");
