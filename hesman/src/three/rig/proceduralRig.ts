import * as THREE from "three";
import layoutJson from "./rigLayout.json";
import { UnitManifest } from "./manifest";

interface PivotDef {
  name: string;
  parent: string | null;
  pos: [number, number, number];
}

interface UnitLayout {
  role: string;
  body: { center: [number, number, number]; size: [number, number, number] };
  headScale: number;
  legScale: number;
  pivots: PivotDef[];
}

const layout = layoutJson as unknown as Record<string, UnitLayout>;
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Fallback used when a GLB is missing or fails validation: primitive geometry
 * on the exact pivot hierarchy the Blender assets export, so the same manifest,
 * timelines and docking code drive it.
 */
export function buildProceduralRig(manifest: UnitManifest): THREE.Object3D {
  const unit = layout[manifest.id];
  const mats = {
    paint: new THREE.MeshStandardMaterial({ color: manifest.color, metalness: 0.4, roughness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: "#3b3f47", metalness: 0.8, roughness: 0.45 }),
    white: new THREE.MeshStandardMaterial({ color: "#e8eaee", metalness: 0.05, roughness: 0.4 }),
    eye: new THREE.MeshStandardMaterial({ name: "glow_eye", color: "#ffd23f", emissive: "#ffc21a", emissiveIntensity: 3 }),
    emblem: new THREE.MeshStandardMaterial({ name: "glow_emblem", color: "#ffd23f", emissive: "#ffc21a", emissiveIntensity: 1 }),
  };

  const nodes = new Map<string, THREE.Object3D>();
  const world = new Map<string, THREE.Vector3>();
  for (const p of unit.pivots) {
    const o = new THREE.Group();
    o.name = p.name;
    o.position.set(...p.pos);
    if (p.parent) nodes.get(p.parent)!.add(o);
    nodes.set(p.name, o);
    world.set(p.name, (p.parent ? world.get(p.parent)!.clone() : new THREE.Vector3()).add(o.position));
  }

  const box = (pivot: string, mat: THREE.Material, size: [number, number, number], at: THREE.Vector3) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), mat);
    mesh.position.copy(at).sub(world.get(pivot)!);
    nodes.get(pivot)!.add(mesh);
    return mesh;
  };
  const segment = (pivot: string, from: THREE.Vector3, to: THREE.Vector3, w: number, mat: THREE.Material) => {
    const dir = to.clone().sub(from);
    const mesh = box(pivot, mat, [w, dir.length(), w], from.clone().add(to).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
  };
  const w = (n: string) => world.get(n)!.clone();

  const [W, H, L] = unit.body.size;
  box("body", mats.paint, [W, H, L], w("body"));
  const k = unit.headScale;
  box("head", mats.paint, [0.62 * k, 0.5 * k, 0.6 * k], w("head").add(new THREE.Vector3(0, 0.05 * k, 0.3 * k)));
  box("head", mats.white, [0.44 * k, 0.3 * k, 0.45 * k], w("head").add(new THREE.Vector3(0, -0.04 * k, 0.7 * k)));
  for (const sx of [1, -1]) box("head", mats.eye, [0.14 * k, 0.05 * k, 0.04 * k], w("head").add(new THREE.Vector3(sx * 0.17 * k, 0.1 * k, 0.66 * k)));
  box("jaw", mats.white, [0.4 * k, 0.12 * k, 0.5 * k], w("jaw").add(new THREE.Vector3(0, -0.1 * k, 0.25 * k)));

  const g = unit.legScale * 1.3;
  for (const key of ["FL", "FR", "BL", "BR"]) {
    segment(`hip_${key}`, w(`hip_${key}`), w(`knee_${key}`), 0.24 * g, mats.paint);
    segment(`knee_${key}`, w(`knee_${key}`), w(`paw_${key}`), 0.2 * g, mats.dark);
    box(`paw_${key}`, mats.paint, [0.3 * g, 0.14, 0.4 * g], w(`paw_${key}`).add(new THREE.Vector3(0, -0.07, 0.08)));
  }
  segment("tail_1", w("tail_1"), w("tail_2"), 0.14, mats.dark);
  segment("tail_2", w("tail_2"), w("tail_3"), 0.12, mats.paint);
  segment("tail_3", w("tail_3"), w("tail_3").add(new THREE.Vector3(0, 0.15, -0.4)), 0.1, mats.dark);

  if (nodes.has("ext_head")) {
    box("ext_head", mats.white, [0.5, 0.5, 0.9], w("ext_head").add(new THREE.Vector3(0, 0, 0.6)));
    box("ext_emblem", mats.emblem, [0.9, 0.08, 1.0], w("ext_emblem"));
    box("ext_collar", mats.paint, [1.2, 0.2, 0.3], w("ext_collar"));
    for (const s of ["L", "R"]) {
      box(`fin_${s}`, mats.white, [0.4, 0.06, 1.5], w(`fin_${s}`).add(new THREE.Vector3(0, 0, -0.75)));
    }
  }
  if (nodes.has("ext_fist")) box("ext_fist", mats.white, [0.46, 0.42, 0.7], w("ext_fist").add(new THREE.Vector3(0, 0, -0.45)));
  if (nodes.has("ext_thigh")) box("ext_thigh", mats.white, [0.56, 0.56, 1.4], w("ext_thigh").add(new THREE.Vector3(0, 0, -0.65)));

  return nodes.get("root")!;
}
