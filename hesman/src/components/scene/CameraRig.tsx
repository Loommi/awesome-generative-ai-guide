"use client";

import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { sceneBridge } from "@/three/sceneBridge";
import { useHesmanStore } from "@/state/store";

export function CameraRig() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const mode = useHesmanStore((s) => s.mode);
  const reducedMotion = useHesmanStore((s) => s.reducedMotion);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    sceneBridge.cameraControls = controls;
    controls.setLookAt(0, 24, 2, 0, 0, 0, false);
    const introDelay = reducedMotion ? 50 : 2600;
    const timer = setTimeout(() => {
      controls
        .setLookAt(11, 7, 17, 0, 1.3, 0, !reducedMotion)
        .then(() => {
          useHesmanStore.getState().setMode("beast");
        });
    }, introDelay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.enabled = mode === "beast" || mode === "combined" || mode === "exploded";
  }, [mode]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={2.6}
      maxDistance={38}
      minPolarAngle={0.001}
      maxPolarAngle={Math.PI - 0.001}
      dollySpeed={0.55}
      truckSpeed={0.8}
      smoothTime={0.45}
    />
  );
}
