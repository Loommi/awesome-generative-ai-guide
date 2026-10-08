"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { jointStateBag } from "@/three/stateBag";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";
import { LionId } from "@/lib/types";
import { useHesmanStore } from "@/state/store";

function Connector({ id }: { id: LionId }) {
  const lineObj = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.95, 0),
      new THREE.Vector3(0, 1.95, 0),
    ]);
    const material = new THREE.LineDashedMaterial({
      color: "#22d3ee",
      dashSize: 0.28,
      gapSize: 0.16,
      transparent: true,
      opacity: 0.75,
      linewidth: 1,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
  }, []);

  useFrame(() => {
    const js = jointStateBag.get(id);
    if (!js) return;
    const pos = lineObj.geometry.getAttribute("position") as THREE.BufferAttribute;
    pos.setXYZ(0, 0, 1.95, 0);
    pos.setXYZ(1, js.root.px, js.root.py, js.root.pz);
    pos.needsUpdate = true;
    lineObj.computeLineDistances();
  });

  return <primitive object={lineObj} />;
}

function Label({ id }: { id: LionId }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const js = jointStateBag.get(id);
    if (js && groupRef.current) {
      groupRef.current.position.set(js.root.px, js.root.py + 1.3, js.root.pz);
    }
  });
  const cfg = LION_CONFIGS[id];
  return (
    <group ref={groupRef}>
      <Html center distanceFactor={13} occlude={false} zIndexRange={[10, 0]}>
        <div className="pointer-events-none select-none whitespace-nowrap rounded-sm border border-cyan-400/40 bg-[#040810]/85 px-2 py-1 font-mono text-[10px] tracking-widest text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
          <span className="text-cyan-500">{cfg.id.toUpperCase()}</span>
          <span className="mx-1 text-slate-500">/</span>
          {cfg.robotPart.toUpperCase()}
        </div>
      </Html>
    </group>
  );
}

export function ExplodedOverlay() {
  const mode = useHesmanStore((s) => s.mode);
  const visible = mode === "exploded" || mode === "exploding" || mode === "reassembling";
  if (!visible) return null;
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
