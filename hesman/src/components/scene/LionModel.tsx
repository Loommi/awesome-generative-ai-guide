"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { geo } from "@/three/geometries";
import { createLionJointState } from "@/three/jointState";
import { lionRegistry } from "@/three/registry";
import { LionId, LionRole } from "@/lib/types";
import { dockRootXform } from "@/three/poses";
import { useHesmanStore } from "@/state/store";
import { LION_CONFIGS } from "@/lib/lionConfigs";
import { jointStateBag } from "@/three/stateBag";

interface LionMaterials {
  primary: THREE.MeshStandardMaterial;
  secondary: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  metal: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
}

function useLionMaterials(
  colorPrimary: string,
  colorSecondary: string,
  colorAccent: string,
): LionMaterials {
  return useMemo(() => {
    return {
      primary: new THREE.MeshStandardMaterial({
        color: colorPrimary,
        metalness: 0.75,
        roughness: 0.32,
      }),
      secondary: new THREE.MeshStandardMaterial({
        color: colorSecondary,
        metalness: 0.55,
        roughness: 0.45,
      }),
      accent: new THREE.MeshStandardMaterial({
        color: colorAccent,
        emissive: colorAccent,
        emissiveIntensity: 1.4,
        metalness: 0.3,
        roughness: 0.4,
        toneMapped: false,
      }),
      metal: new THREE.MeshStandardMaterial({
        color: "#d9dde3",
        metalness: 0.9,
        roughness: 0.22,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: "#050608",
        metalness: 0.2,
        roughness: 0.1,
      }),
      eye: new THREE.MeshStandardMaterial({
        color: "#ffd34d",
        emissive: "#ffb300",
        emissiveIntensity: 1.8,
        toneMapped: false,
      }),
    };
  }, [colorPrimary, colorSecondary, colorAccent]);
}

interface LegUnitProps {
  attach: [number, number, number];
  materials: LionMaterials;
  hipRef: React.RefObject<THREE.Group | null>;
  kneeRef: React.RefObject<THREE.Group | null>;
  pawRef: React.RefObject<THREE.Group | null>;
}

function LegUnit({ attach, materials, hipRef, kneeRef, pawRef }: LegUnitProps) {
  return (
    <group ref={hipRef} position={attach}>
      <mesh geometry={geo.hipJoint} material={materials.secondary} />
      <mesh
        geometry={geo.upperLeg}
        material={materials.secondary}
        position={[0, -0.45, 0]}
        castShadow
      />
      <mesh
        geometry={geo.piston}
        material={materials.accent}
        position={[0.07, -0.45, 0.07]}
        scale={[0.6, 1, 0.6]}
      />
      <group ref={kneeRef} position={[0, -0.95, 0]}>
        <mesh geometry={geo.kneeJoint} material={materials.accent} scale={0.75} />
        <mesh
          geometry={geo.lowerLeg}
          material={materials.primary}
          position={[0, -0.42, 0]}
          castShadow
        />
        <group ref={pawRef} position={[0, -0.9, 0.04]}>
          <mesh geometry={geo.pawBase} material={materials.secondary} castShadow />
          {[-0.09, 0, 0.09].map((x, i) => (
            <mesh
              key={i}
              geometry={geo.claw}
              material={materials.metal}
              position={[x, -0.03, 0.22]}
              rotation={[Math.PI / 2.1, 0, 0]}
            />
          ))}
        </group>
      </group>
    </group>
  );
}

const LEG_ATTACH = {
  FL: [0.68, 0.55, 0.85] as [number, number, number],
  FR: [-0.68, 0.55, 0.85] as [number, number, number],
  BL: [0.68, 0.55, -0.85] as [number, number, number],
  BR: [-0.68, 0.55, -0.85] as [number, number, number],
};

export interface LionModelProps {
  id: LionId;
  role: LionRole;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  scale: number;
  onSelect: (id: LionId) => void;
}

export function LionModel({
  id,
  role,
  colorPrimary,
  colorSecondary,
  colorAccent,
  scale,
  onSelect,
}: LionModelProps) {
  const materials = useLionMaterials(colorPrimary, colorSecondary, colorAccent);
  const state = useMemo(() => createLionJointState(), []);
  const emblemMats = useMemo(
    () => ({
      green: new THREE.MeshStandardMaterial({
        color: LION_CONFIGS.green.colorPrimary,
        emissive: LION_CONFIGS.green.colorPrimary,
        emissiveIntensity: 0.6,
      }),
      red: new THREE.MeshStandardMaterial({
        color: LION_CONFIGS.red.colorPrimary,
        emissive: LION_CONFIGS.red.colorPrimary,
        emissiveIntensity: 0.6,
      }),
      blue: new THREE.MeshStandardMaterial({
        color: LION_CONFIGS.blue.colorPrimary,
        emissive: LION_CONFIGS.blue.colorPrimary,
        emissiveIntensity: 0.6,
      }),
      orange: new THREE.MeshStandardMaterial({
        color: LION_CONFIGS.orange.colorPrimary,
        emissive: LION_CONFIGS.orange.colorPrimary,
        emissiveIntensity: 0.6,
      }),
    }),
    [],
  );

  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const jawRef = useRef<THREE.Group>(null);
  const finLRef = useRef<THREE.Group>(null);
  const finRRef = useRef<THREE.Group>(null);
  const emblemRef = useRef<THREE.Group>(null);
  const buckleRef = useRef<THREE.Group>(null);

  const legFLHip = useRef<THREE.Group>(null);
  const legFLKnee = useRef<THREE.Group>(null);
  const legFLPaw = useRef<THREE.Group>(null);
  const legFRHip = useRef<THREE.Group>(null);
  const legFRKnee = useRef<THREE.Group>(null);
  const legFRPaw = useRef<THREE.Group>(null);
  const legBLHip = useRef<THREE.Group>(null);
  const legBLKnee = useRef<THREE.Group>(null);
  const legBLPaw = useRef<THREE.Group>(null);
  const legBRHip = useRef<THREE.Group>(null);
  const legBRKnee = useRef<THREE.Group>(null);
  const legBRPaw = useRef<THREE.Group>(null);
  const tailS1 = useRef<THREE.Group>(null);
  const tailS2 = useRef<THREE.Group>(null);
  const tailS3 = useRef<THREE.Group>(null);
  const earLRef = useRef<THREE.Group>(null);
  const earRRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const dock = dockRootXform(id);
    state.root.px = dock.pos[0];
    state.root.py = dock.pos[1];
    state.root.pz = dock.pos[2];
    state.root.ry = dock.rot[1];
    rootRef.current?.position.set(...dock.pos);
    rootRef.current?.rotation.set(dock.rot[0], dock.rot[1], dock.rot[2]);

    if (
      rootRef.current &&
      bodyRef.current &&
      neckRef.current &&
      headRef.current &&
      jawRef.current &&
      legFLHip.current &&
      legFLKnee.current &&
      legFLPaw.current &&
      legFRHip.current &&
      legFRKnee.current &&
      legFRPaw.current &&
      legBLHip.current &&
      legBLKnee.current &&
      legBLPaw.current &&
      legBRHip.current &&
      legBRKnee.current &&
      legBRPaw.current &&
      tailS1.current &&
      tailS2.current &&
      tailS3.current
    ) {
      lionRegistry.register(id, {
        root: rootRef.current,
        pose: rootRef.current,
        body: bodyRef.current,
        neck: neckRef.current,
        head: headRef.current,
        jaw: jawRef.current,
        legFL: { hip: legFLHip.current, knee: legFLKnee.current, paw: legFLPaw.current },
        legFR: { hip: legFRHip.current, knee: legFRKnee.current, paw: legFRPaw.current },
        legBL: { hip: legBLHip.current, knee: legBLKnee.current, paw: legBLPaw.current },
        legBR: { hip: legBRHip.current, knee: legBRKnee.current, paw: legBRPaw.current },
        tail: [tailS1.current, tailS2.current, tailS3.current],
        chestEmblem: emblemRef.current ?? undefined,
        starBuckle: buckleRef.current ?? undefined,
        finL: finLRef.current ?? undefined,
        finR: finRRef.current ?? undefined,
      });
    }
    return () => lionRegistry.unregister(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    jointStateBag.set(id, state);
    return () => {
      jointStateBag.delete(id);
    };
  }, [id, state]);

  useFrame((threeState) => {
    const t = threeState.clock.elapsedTime;
    const mode = useHesmanStore.getState().mode;
    const selected = useHesmanStore.getState().selectedUnit === id;
    const idleOn = mode === "beast" || mode === "intro";
    const idleBreath = idleOn ? Math.sin(t * 1.6 + id.length) * 0.012 : 0;
    const idleSway = idleOn ? Math.sin(t * 0.8 + id.length) * 0.04 : 0;

    if (rootRef.current) {
      rootRef.current.position.set(state.root.px, state.root.py, state.root.pz);
      rootRef.current.rotation.set(state.root.rx, state.root.ry, state.root.rz);
    }
    if (bodyRef.current) {
      bodyRef.current.rotation.set(
        state.body.rx,
        state.body.ry,
        state.body.rz,
      );
      const b = 1 + idleBreath;
      bodyRef.current.scale.set(b, 1 + idleBreath * 0.6, b);
    }
    if (neckRef.current) {
      neckRef.current.position.set(state.neck.px, state.neck.py, state.neck.pz);
      neckRef.current.rotation.set(state.neck.rx, state.neck.ry, state.neck.rz);
    }
    if (headRef.current) {
      headRef.current.rotation.set(state.head.rx, state.head.ry, state.head.rz);
    }
    if (jawRef.current) {
      jawRef.current.rotation.x = state.jaw.rx;
    }
    const legs = [
      [legFLHip, legFLKnee, legFLPaw, state.legFL],
      [legFRHip, legFRKnee, legFRPaw, state.legFR],
      [legBLHip, legBLKnee, legBLPaw, state.legBL],
      [legBRHip, legBRKnee, legBRPaw, state.legBR],
    ] as const;
    for (const [hip, knee, paw, s] of legs) {
      hip.current?.rotation.set(
        s.hip.rx + (idleOn ? idleSway * 0.3 : 0),
        s.hip.ry,
        s.hip.rz,
      );
      knee.current?.rotation.set(s.knee.rx, s.knee.ry, s.knee.rz);
      paw.current?.rotation.set(s.paw.rx, s.paw.ry, s.paw.rz);
    }
    tailS1.current?.rotation.set(
      state.tail.s1.rx + (idleOn ? idleSway : 0),
      state.tail.s1.ry,
      state.tail.s1.rz,
    );
    tailS2.current?.rotation.set(
      state.tail.s2.rx + (idleOn ? idleSway * 0.8 : 0),
      state.tail.s2.ry,
      state.tail.s2.rz,
    );
    tailS3.current?.rotation.set(
      state.tail.s3.rx + (idleOn ? idleSway * 0.6 : 0),
      state.tail.s3.ry,
      state.tail.s3.rz,
    );
    if (finLRef.current) finLRef.current.rotation.z = THREE.MathUtils.degToRad(state.fin.angle);
    if (finRRef.current) finRRef.current.rotation.z = THREE.MathUtils.degToRad(-state.fin.angle);
    if (emblemRef.current) emblemRef.current.scale.setScalar(state.emblem.scale);
    if (buckleRef.current) buckleRef.current.scale.setScalar(state.emblem.scale);

    const pulse = 1.3 + Math.sin(t * 2.4 + id.length) * 0.5 + (selected ? 0.8 : 0);
    materials.accent.emissiveIntensity = pulse;
    if (earLRef.current) earLRef.current.rotation.x = -state.fin.angle * 0.003;
    if (earRRef.current) earRRef.current.rotation.x = -state.fin.angle * 0.003;
  });

  const isBlack = role === "torso";

  return (
    <group
      ref={rootRef}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <group ref={bodyRef} position={[0, 0.9, 0]}>
        <mesh geometry={geo.bodyCore} material={materials.primary} castShadow receiveShadow />
        <mesh geometry={geo.spineRidge} material={materials.secondary} position={[0, 0.47, 0.1]} />
        <mesh geometry={geo.sidePanel} material={materials.secondary} position={[0.78, 0, 0]} />
        <mesh geometry={geo.sidePanel} material={materials.secondary} position={[-0.78, 0, 0]} />
        {isBlack && (
          <group ref={emblemRef} position={[0, 0.1, 1.18]} scale={0}>
            <mesh geometry={geo.chestPlate} material={materials.glass} position={[0, 0, -0.03]} />
            <mesh geometry={geo.emblemV} material={emblemMats.green} position={[-0.16, 0, 0]} />
            <mesh geometry={geo.emblemV} material={emblemMats.red} position={[0.16, 0, 0]} />
            <mesh geometry={geo.emblemH} material={emblemMats.blue} position={[-0.11, 0, 0]} scale={[0.5, 1, 1]} />
            <mesh geometry={geo.emblemH} material={emblemMats.orange} position={[0.11, 0, 0]} scale={[0.5, 1, 1]} />
          </group>
        )}
        {isBlack && (
          <group ref={buckleRef} position={[0, -0.35, 1.0]} scale={0}>
            <mesh geometry={geo.star} material={materials.secondary} rotation={[0.3, 0, 0.4]} />
          </group>
        )}
        {isBlack && (
          <>
            <group ref={finLRef} position={[0.78, 0.3, -0.3]}>
              <mesh geometry={geo.fin} material={materials.secondary} position={[0.3, 0, 0]} />
            </group>
            <group ref={finRRef} position={[-0.78, 0.3, -0.3]}>
              <mesh geometry={geo.fin} material={materials.secondary} position={[-0.3, 0, 0]} />
            </group>
          </>
        )}
        <mesh geometry={geo.connector} material={materials.accent} position={[0.75, 0.1, 0.8]} />
        <mesh geometry={geo.connector} material={materials.accent} position={[-0.75, 0.1, 0.8]} />
        <mesh geometry={geo.connector} material={materials.accent} position={[0.75, 0.1, -0.8]} />
        <mesh geometry={geo.connector} material={materials.accent} position={[-0.75, 0.1, -0.8]} />

        <group ref={neckRef}>
          <group ref={headRef}>
            <mesh geometry={geo.skull} material={materials.primary} castShadow />
            <mesh geometry={geo.muzzle} material={materials.secondary} position={[0, -0.05, 0.42]} />
            <group ref={earLRef} position={[0.22, 0.28, -0.05]}>
              <mesh geometry={geo.ear} material={materials.secondary} />
            </group>
            <group ref={earRRef} position={[-0.22, 0.28, -0.05]}>
              <mesh geometry={geo.ear} material={materials.secondary} />
            </group>
            <mesh geometry={geo.eye} material={materials.eye} position={[0.16, 0.03, 0.58]} />
            <mesh geometry={geo.eye} material={materials.eye} position={[-0.16, 0.03, 0.58]} />
            <group ref={jawRef} position={[0, -0.14, 0.3]}>
              <mesh geometry={geo.jawLower} material={materials.secondary} position={[0, -0.06, 0.1]} />
              {[-0.1, -0.03, 0.04, 0.11].map((x, i) => (
                <mesh
                  key={i}
                  geometry={geo.tooth}
                  material={materials.metal}
                  position={[x, -0.1, 0.28]}
                  rotation={[Math.PI, 0, 0]}
                />
              ))}
            </group>
          </group>
        </group>

        <LegUnit attach={LEG_ATTACH.FL} materials={materials} hipRef={legFLHip} kneeRef={legFLKnee} pawRef={legFLPaw} />
        <LegUnit attach={LEG_ATTACH.FR} materials={materials} hipRef={legFRHip} kneeRef={legFRKnee} pawRef={legFRPaw} />
        <LegUnit attach={LEG_ATTACH.BL} materials={materials} hipRef={legBLHip} kneeRef={legBLKnee} pawRef={legBLPaw} />
        <LegUnit attach={LEG_ATTACH.BR} materials={materials} hipRef={legBRHip} kneeRef={legBRKnee} pawRef={legBRPaw} />

        <group ref={tailS1} position={[0, 0.3, -1.1]}>
          <mesh geometry={geo.tailSeg1} material={materials.primary} position={[0, 0, -0.27]} rotation={[Math.PI / 2, 0, 0]} />
          <group ref={tailS2} position={[0, 0, -0.55]}>
            <mesh geometry={geo.tailSeg2} material={materials.secondary} position={[0, 0, -0.25]} rotation={[Math.PI / 2, 0, 0]} />
            <group ref={tailS3} position={[0, 0, -0.5]}>
              <mesh geometry={geo.tailSeg3} material={materials.accent} position={[0, 0, -0.25]} rotation={[Math.PI / 2, 0, 0]} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
