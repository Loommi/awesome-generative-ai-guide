"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { assembly } from "@/three/rig/assembly";
import { MANIFEST } from "@/three/rig/manifest";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";
import { LionId } from "@/lib/types";
import { useHesmanStore } from "@/state/store";

/** Dashed line between a limb's mount node and the torso attachment it docks to. */
function Connector({ id }: { id: LionId }) {
  const line = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const material = new THREE.LineDashedMaterial({
      color: "#22d3ee",
      dashSize: 0.3,
      gapSize: 0.18,
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    });
    const l = new THREE.Line(geometry, material);
    l.renderOrder = 10;
    l.frustumCulled = false;
    return l;
  }, []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!assembly.ready) return;
    assembly.hostPosition(id, a);
    assembly.worldPosition(id, MANIFEST[id].mount!.mountNode, b);
    const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
    pos.setXYZ(0, a.x, a.y, a.z);
    pos.setXYZ(1, b.x, b.y, b.z);
    pos.needsUpdate = true;
    line.computeLineDistances();
  });

  return <primitive object={line} />;
}

function Label({ id }: { id: LionId }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (assembly.ready && group.current) {
      assembly.worldPosition(id, MANIFEST[id].labelNode, group.current.position);
      group.current.position.y += 0.4;
    }
  });
  const cfg = LION_CONFIGS[id];
  return (
    <group ref={group}>
      <Html center distanceFactor={18} zIndexRange={[10, 0]}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-sm border border-cyan-400/40 bg-[#040810]/85 px-2 py-1 font-mono text-[10px] tracking-widest text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
          <span className="text-cyan-500">{cfg.id.toUpperCase()}</span>
          <span className="mx-1 text-slate-500">/</span>
          {cfg.robotPart.toUpperCase()}
          {MANIFEST[id].mount && (
            <span className="ml-1 text-slate-500">→ {MANIFEST[id].mount!.host.replace("att_", "").toUpperCase()}</span>
          )}
        </div>
      </Html>
    </group>
  );
}

export function ExplodedOverlay() {
  const mode = useHesmanStore((s) => s.mode);
  if (mode !== "exploded" && mode !== "exploding" && mode !== "reassembling") return null;
  return (
    <group>
      {LION_ORDER.filter((id) => id !== "black").map((id) => (
        <Connector key={id} id={id} />
      ))}
      {LION_ORDER.map((id) => (
        <Label key={id} id={id} />
      ))}
    </group>
  );
}
