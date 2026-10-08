"use client";

import { Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Hangar } from "./Hangar";
import { MechAssembly } from "./MechAssembly";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { ExplodedOverlay } from "./ExplodedOverlay";
import { useHesmanStore } from "@/state/store";

export function Experience() {
  const selectUnit = useHesmanStore((s) => s.selectUnit);
  const handleBackgroundClick = useCallback(() => selectUnit(null), [selectUnit]);
  const fx = typeof window === "undefined" || new URLSearchParams(window.location.search).get("fx") !== "off";

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [12, 8.5, 19], fov: 42, near: 0.1, far: 250 }}
      onPointerMissed={handleBackgroundClick}
    >
      <color attach="background" args={["#05080f"]} />
      <Suspense fallback={null}>
        <Hangar />
        <MechAssembly />
        <ExplodedOverlay />
        {fx && <Effects />}
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}
