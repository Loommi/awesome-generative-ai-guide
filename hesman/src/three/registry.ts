import * as THREE from "three";
import { LionId } from "@/lib/types";

export interface LegRefs {
  hip: THREE.Group;
  knee: THREE.Group;
  paw: THREE.Group;
}

export interface LionRefs {
  root: THREE.Group;
  pose: THREE.Group;
  body: THREE.Group;
  neck: THREE.Group;
  head: THREE.Group;
  jaw: THREE.Group;
  legFL: LegRefs;
  legFR: LegRefs;
  legBL: LegRefs;
  legBR: LegRefs;
  tail: [THREE.Group, THREE.Group, THREE.Group];
  chestEmblem?: THREE.Group;
  starBuckle?: THREE.Group;
  finL?: THREE.Group;
  finR?: THREE.Group;
}

class LionRegistry {
  private map = new Map<LionId, LionRefs>();
  private listeners = new Set<() => void>();

  register(id: LionId, refs: LionRefs) {
    this.map.set(id, refs);
    this.listeners.forEach((l) => l());
  }

  unregister(id: LionId) {
    this.map.delete(id);
  }

  get(id: LionId): LionRefs | undefined {
    return this.map.get(id);
  }

  getAll(): Map<LionId, LionRefs> {
    return this.map;
  }

  isComplete(ids: LionId[]): boolean {
    return ids.every((id) => this.map.has(id));
  }

  onReady(cb: () => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const lionRegistry = new LionRegistry();
