"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { hangarLights } from "@/three/sceneBridge";
import { DOCK_LAYOUT } from "@/three/poses";
import { LION_CONFIGS, LION_ORDER } from "@/lib/lionConfigs";

function DockPad({ angleDeg, radius, color }: { angleDeg: number; radius: number; color: string }) {
  const theta = (angleDeg * Math.PI) / 180;
  const x = Math.sin(theta) * radius;
  const z = Math.cos(theta) * radius;
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ringRef.current) ringRef.current.rotation.z += dt * 0.25;
  });
  return (
    <group position={[x, 0.02, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.6, 1.6, 0.04, 48]} />
        <meshStandardMaterial color="#0a0f16" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[1.25, 1.4, 48]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, 0]}>
        <ringGeometry args={[1.5, 1.55, 48]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
    </group>
  );
}

function CentralPlatform() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ring1.current) ring1.current.rotation.z += dt * 0.08;
    if (ring2.current) ring2.current.rotation.z -= dt * 0.05;
  });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[4.6, 4.9, 0.12, 64]} />
        <meshStandardMaterial color="#0c1119" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh ref={ring1} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[3.4, 3.55, 64]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      <mesh ref={ring2} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.085, 0]}>
        <ringGeometry args={[4.0, 4.1, 64]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 4.3, 0.09, Math.cos(a) * 4.3]} rotation={[-Math.PI / 2, 0, -a]}>
            <planeGeometry args={[0.04, 0.5]} />
            <meshStandardMaterial color="#67e8f9" emissive="#67e8f9" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

function Pillars() {
  const pillars = useMemo(() => {
    const arr: { pos: [number, number, number]; h: number }[] = [];
    const count = 14;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = 20 + (i % 3) * 4;
      arr.push({ pos: [Math.sin(a) * r, 0, Math.cos(a) * r], h: 10 + (i % 4) * 3 });
    }
    return arr;
  }, []);
  return (
    <group>
      {pillars.map((p, i) => (
        <mesh key={i} position={[p.pos[0], p.h / 2, p.pos[2]]}>
          <boxGeometry args={[1.1, p.h, 1.1]} />
          <meshStandardMaterial color="#05070a" metalness={0.8} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function LightStrips() {
  const strips = useMemo(() => {
    const arr: { pos: [number, number, number]; len: number; rot: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      arr.push({ pos: [Math.sin(a) * 11, 0.03, Math.cos(a) * 11], len: 6, rot: a });
    }
    return arr;
  }, []);
  return (
    <group>
      {strips.map((s, i) => (
        <mesh key={i} position={s.pos} rotation={[-Math.PI / 2, 0, s.rot]}>
          <planeGeometry args={[0.18, s.len]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export function Hangar() {
  const { scene } = useThree();
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const warnRefs = useRef<THREE.PointLight[]>([]);
  const fog = useMemo(() => new THREE.FogExp2("#01030a", 0.018), []);

  scene.fog = fog;

  useFrame(() => {
    if (ambientRef.current) ambientRef.current.intensity = 0.35 * hangarLights.ambient;
    if (keyRef.current) keyRef.current.intensity = 1.6 * hangarLights.key;
    if (rimRef.current) rimRef.current.intensity = 2.2 * hangarLights.rim;
    fog.density = 0.016 * hangarLights.fogDensity;
    warnRefs.current.forEach((l, i) => {
      if (!l) return;
      const pulse = (Math.sin(performance.now() * 0.004 + i) + 1) / 2;
      l.intensity = hangarLights.warn * (1.2 + pulse * 1.8);
    });
  });

  return (
    <group>
      <ambientLight ref={ambientRef} intensity={0.35} color="#3a5a7a" />
      <directionalLight
        ref={keyRef}
        position={[8, 16, 6]}
        intensity={1.6}
        color="#dff3ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight ref={rimRef} position={[-10, 8, -10]} intensity={2.2} color="#22d3ee" />
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <pointLight
            key={i}
            ref={(r) => {
              if (r) warnRefs.current[i] = r;
            }}
            position={[Math.sin(a) * 9, 3, Math.cos(a) * 9]}
            color="#f59e0b"
            intensity={0}
            distance={14}
          />
        );
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#060a10" metalness={0.5} roughness={0.8} />
      </mesh>

      <CentralPlatform />
      <LightStrips />
      {LION_ORDER.filter((id) => id !== "black").map((id) => {
        const dock = DOCK_LAYOUT[id];
        return <DockPad key={id} angleDeg={dock.angleDeg} radius={dock.radius} color={LION_CONFIGS[id].colorPrimary} />;
      })}
      <Pillars />
      <Sparkles count={160} scale={[36, 14, 36]} size={1.6} speed={0.25} color="#8fd9ff" opacity={0.5} />
    </group>
  );
}
