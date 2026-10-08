"use client";

import { Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Hangar } from "./Hangar";
import { LionModel } from "./LionModel";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { ExplodedOverlay } from "./ExplodedOverlay";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";
import { LION_SCALE, dockRootXform } from "@/three/poses";
import { useHesmanStore } from "@/state/store";
import { sceneBridge } from "@/three/sceneBridge";
import { LionId } from "@/lib/types";
import { playUiSound } from "@/audio/sound";

export function Experience() {
  const mode = useHesmanStore((s) => s.mode);
  const selectUnit = useHesmanStore((s) => s.selectUnit);
  const audioEnabled = useHesmanStore((s) => s.audioEnabled);

  const handleSelect = useCallback(
    (id: LionId) => {
      selectUnit(id);
      playUiSound(audioEnabled, "select");
      if (mode === "beast" || mode === "intro") {
        const dock = dockRootXform(id);
        const [dx, dy, dz] = dock.pos;
        sceneBridge.cameraControls?.setLookAt(dx + 3.4, dy + 2.6, dz + 3.4, dx, dy + 1, dz, true);
      }
    },
    [mode, selectUnit, audioEnabled],
  );

  const handleBackgroundClick = useCallback(() => {
    selectUnit(null);
  }, [selectUnit]);

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [11, 7, 17], fov: 45, near: 0.1, far: 200 }}
      onPointerMissed={handleBackgroundClick}
    >
      <color attach="background" args={["#01030a"]} />
      <Suspense fallback={null}>
        <Hangar />
        {LION_ORDER.map((id) => {
          const cfg = LION_CONFIGS[id];
          return (
            <LionModel
              key={id}
              id={id}
              role={cfg.role}
              colorPrimary={cfg.colorPrimary}
              colorSecondary={cfg.colorSecondary}
              colorAccent={cfg.colorAccent}
              scale={LION_SCALE[id]}
              onSelect={handleSelect}
            />
          );
        })}
        <ExplodedOverlay />
        <Effects />
      </Suspense>
      <CameraRig />
    </Canvas>
  );
}
