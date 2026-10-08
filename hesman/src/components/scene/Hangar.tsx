"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import { hangarLights } from "@/three/sceneBridge";
import { MANIFEST } from "@/three/rig/manifest";
import { LION_ORDER } from "@/lib/lionConfigs";

const ringMaterials: THREE.MeshStandardMaterial[] = [];

function glowMaterial(color: string, intensity: number, pulse = false) {
  const m = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, toneMapped: false });
  if (pulse) {
    m.userData.base = intensity;
    ringMaterials.push(m);
  }
  return m;
}

function DockPad({ angleDeg, radius, color }: { angleDeg: number; radius: number; color: string }) {
  const theta = (angleDeg * Math.PI) / 180;
  const ringRef = useRef<THREE.Mesh>(null);
  const mats = useMemo(() => ({ ring: glowMaterial(color, 1.2), edge: glowMaterial("#22d3ee", 0.9, true) }), [color]);
  useFrame((_, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.25;
  });
  return (
    <group position={[Math.sin(theta) * radius, 0.02, Math.cos(theta) * radius]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[2.7, 2.8, 0.06, 64]} />
        <meshStandardMaterial color="#141b26" metalness={0.6} roughness={0.45} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]} material={mats.ring}>
        <ringGeometry args={[2.2, 2.38, 64, 1, 0, Math.PI * 1.6]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} material={mats.edge}>
        <ringGeometry args={[2.62, 2.68, 64]} />
      </mesh>
    </group>
  );
}

function CentralPlatform() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const mats = useMemo(
    () => ({ a: glowMaterial("#22d3ee", 1, true), b: glowMaterial("#38bdf8", 0.7, true), tick: glowMaterial("#67e8f9", 1.2, true) }),
    [],
  );
  useFrame((_, dt) => {
    if (ring1.current) ring1.current.rotation.z += dt * 0.08;
    if (ring2.current) ring2.current.rotation.z -= dt * 0.05;
  });
  return (
    <group>
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[5.4, 5.7, 0.08, 72]} />
        <meshStandardMaterial color="#161e2a" metalness={0.65} roughness={0.38} />
      </mesh>
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} material={mats.a}>
        <ringGeometry args={[4.3, 4.45, 72, 1, 0, Math.PI * 1.75]} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.085, 0]} material={mats.b}>
        <ringGeometry args={[4.9, 5.0, 72]} />
      </mesh>
      {Array.from({ length: 28 }).map((_, i) => {
        const a = (i / 28) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 5.2, 0.09, Math.cos(a) * 5.2]} rotation={[-Math.PI / 2, 0, -a]} material={mats.tick}>
            <planeGeometry args={[0.05, 0.4]} />
          </mesh>
        );
      })}
    </group>
  );
}

function Structure() {
  const pillars = useMemo(() => {
    const arr: { pos: [number, number, number]; h: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const r = 24 + (i % 3) * 4;
      arr.push({ pos: [Math.sin(a) * r, 0, Math.cos(a) * r], h: 14 + (i % 4) * 4 });
    }
    return arr;
  }, []);
  const strip = useMemo(() => glowMaterial("#22d3ee", 1.1), []);
  return (
    <group>
      {pillars.map((p, i) => (
        <group key={i} position={[p.pos[0], 0, p.pos[2]]}>
          <mesh position={[0, p.h / 2, 0]}>
            <boxGeometry args={[1.4, p.h, 1.4]} />
            <meshStandardMaterial color="#121822" metalness={0.7} roughness={0.55} />
          </mesh>
          <mesh position={[0, p.h * 0.55, 0.71]} material={strip}>
            <planeGeometry args={[0.08, p.h * 0.7]} />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 13, 0.03, Math.cos(a) * 13]} rotation={[-Math.PI / 2, 0, a]} material={strip}>
            <planeGeometry args={[0.16, 5]} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Hangar() {
  const scene = useThree((s) => s.scene);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const warnRefs = useRef<THREE.PointLight[]>([]);
  const fog = useMemo(() => new THREE.FogExp2("#070b14", 0.011), []);

  useFrame(({ clock }) => {
    scene.fog = fog;
    scene.environmentIntensity = 0.85 * hangarLights.ambient;
    if (hemiRef.current) hemiRef.current.intensity = 0.9 * hangarLights.ambient;
    if (keyRef.current) keyRef.current.intensity = 2.4 * hangarLights.key;
    if (rimRef.current) rimRef.current.intensity = 1.6 * hangarLights.rim;
    fog.density = 0.011 * hangarLights.fogDensity;
    const t = clock.elapsedTime;
    warnRefs.current.forEach((l, i) => {
      if (l) l.intensity = hangarLights.warn * (6 + ((Math.sin(t * 4 + i) + 1) / 2) * 10);
    });
    for (const m of ringMaterials) m.emissiveIntensity = m.userData.base * (0.7 + hangarLights.platformPulse);
  });

  return (
    <group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#e8f2ff" position={[0, 14, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[18, 10, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#7fdcff" position={[-14, 5, -4]} rotation={[0, Math.PI / 2, 0]} scale={[14, 3, 1]} />
        <Lightformer form="rect" intensity={1.0} color="#ffd9a8" position={[14, 4, 6]} rotation={[0, -Math.PI / 2, 0]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#9fb4d8" position={[0, 3, 16]} rotation={[0, Math.PI, 0]} scale={[20, 4, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#22d3ee" position={[0, 8, -14]} scale={6} />
      </Environment>

      <hemisphereLight ref={hemiRef} args={["#c7dcff", "#1a2230", 0.9]} />
      <directionalLight
        ref={keyRef}
        position={[10, 18, 12]}
        intensity={2.4}
        color="#fff4e6"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={60}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      <directionalLight ref={rimRef} position={[-12, 9, -14]} intensity={1.6} color="#7fdcff" />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <pointLight
            key={i}
            ref={(r) => {
              if (r) warnRefs.current[i] = r;
            }}
            position={[Math.sin(a) * 11, 4, Math.cos(a) * 11]}
            color="#f59e0b"
            intensity={0}
            distance={18}
          />
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[60, 64]} />
        <meshStandardMaterial color="#0d131c" metalness={0.45} roughness={0.62} />
      </mesh>

      <CentralPlatform />
      <Structure />
      {LION_ORDER.filter((id) => MANIFEST[id].dock.radius > 0).map((id) => (
        <DockPad key={id} angleDeg={MANIFEST[id].dock.angleDeg} radius={MANIFEST[id].dock.radius} color={MANIFEST[id].color} />
      ))}
      <Sparkles count={120} scale={[44, 18, 44]} size={1.4} speed={0.22} color="#8fd9ff" opacity={0.4} />
    </group>
  );
}
