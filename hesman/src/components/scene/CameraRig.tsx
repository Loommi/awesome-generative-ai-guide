"use client";

import { useEffect, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";
import { sceneBridge } from "@/three/sceneBridge";
import { beastOverview } from "@/three/cameraPresets";
import { useHesmanStore } from "@/state/store";

export function CameraRig() {
  const controlsRef = useRef<CameraControlsImpl | null>(null);
  const mode = useHesmanStore((s) => s.mode);
  const assetsReady = useHesmanStore((s) => s.assetsReady);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    sceneBridge.cameraControls = controls;
    controls.setLookAt(0, 30, 3, 0, 0, 0, false);
  }, []);

  useEffect(() => {
    if (!assetsReady) return;
    const reduced = useHesmanStore.getState().reducedMotion;
    const timer = setTimeout(() => {
      beastOverview(!reduced);
      setTimeout(() => {
        if (useHesmanStore.getState().mode === "intro") useHesmanStore.getState().setMode("beast");
      }, reduced ? 0 : 1600);
    }, reduced ? 0 : 1200);
    return () => clearTimeout(timer);
  }, [assetsReady]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.enabled = mode === "beast" || mode === "combined" || mode === "exploded";
  }, [mode]);

  return (
    <CameraControls
      ref={controlsRef}
      makeDefault
      minDistance={3}
      maxDistance={48}
      minPolarAngle={0.001}
      maxPolarAngle={Math.PI - 0.001}
      dollySpeed={0.55}
      truckSpeed={0.8}
      smoothTime={0.45}
    />
  );
}
