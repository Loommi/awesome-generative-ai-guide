"use client";

import { useEffect, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { assembly } from "@/three/rig/assembly";
import { loadRigs } from "@/three/rig/loadRigs";
import { focusUnit } from "@/three/cameraPresets";
import { useHesmanStore } from "@/state/store";
import { LION_ORDER } from "@/lib/lionConfigs";
import { playUiSound } from "@/audio/sound";

export function MechAssembly() {
  const [ready, setReady] = useState(assembly.ready);

  useEffect(() => {
    let cancelled = false;
    const forceProcedural = new URLSearchParams(window.location.search).get("rig") === "procedural";
    loadRigs({ forceProcedural }).then(({ rigs, report }) => {
      if (cancelled) return;
      assembly.init(rigs);
      const store = useHesmanStore.getState();
      for (const r of report) {
        store.log(`${r.id.toUpperCase()} LION // ${r.source === "glb" ? "GLB ASSET LOADED" : "PROCEDURAL FALLBACK"}`);
        if (r.reason) console.warn(`HESMAN: ${r.id} using procedural fallback: ${r.reason}`);
      }
      store.setAssetsReady(true);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame((state) => {
    const s = useHesmanStore.getState();
    for (const id of LION_ORDER) {
      const rig = assembly.rigs[id];
      if (rig) rig.highlight = s.selectedUnit === id ? 1 : 0;
    }
    assembly.update(state.clock.elapsedTime, s.mode === "beast" || s.mode === "intro");
  });

  if (!ready) return null;

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const id = assembly.findUnit(e.object);
    if (!id) return;
    const s = useHesmanStore.getState();
    s.selectUnit(id);
    playUiSound(s.audioEnabled, "select");
    if (s.mode === "beast" && !s.busy) {
      gsap.fromTo(assembly.rigs[id], { roar: 0 }, { roar: 1, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out" });
      focusUnit(id);
    }
  };

  return (
    <primitive
      object={assembly.root}
      onClick={onClick}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    />
  );
}
