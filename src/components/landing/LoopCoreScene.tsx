"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

interface LoopCoreMeshProps {
  mouseRef: React.RefObject<{ x: number; y: number }>;
  isReducedMotion?: boolean;
  corePulseScale?: number;
}

function LoopCoreMesh({ mouseRef, isReducedMotion, corePulseScale = 1 }: LoopCoreMeshProps) {
  const outerRingRef = useRef<THREE.Mesh>(null!);
  const innerRingRef = useRef<THREE.Mesh>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const particlesRef = useRef<THREE.Points>(null!);

  // Generate 3D particle positions orbiting the core (200 lightweight particles)
  const particleCount = 200;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const colorIndigo = new THREE.Color("#6366f1");
    const colorPurple = new THREE.Color("#a855f7");
    const colorCyan = new THREE.Color("#38bdf8");

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.0 + Math.random() * 2.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const mixedColor = i % 3 === 0 ? colorIndigo : i % 3 === 1 ? colorPurple : colorCyan;
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }
    return [pos, col];
  }, [particleCount]);

  useFrame((state, delta) => {
    if (isReducedMotion) return;

    // Read directly from mutable Ref — zero React re-renders!
    const mouseX = mouseRef.current?.x || 0;
    const mouseY = mouseRef.current?.y || 0;

    const targetX = mouseY * 0.2;
    const targetY = mouseX * 0.2;

    if (outerRingRef.current) {
      outerRingRef.current.rotation.x += delta * 0.2;
      outerRingRef.current.rotation.y += delta * 0.12;
      outerRingRef.current.rotation.x = THREE.MathUtils.lerp(
        outerRingRef.current.rotation.x,
        targetX + outerRingRef.current.rotation.x,
        0.04
      );
    }

    if (innerRingRef.current) {
      innerRingRef.current.rotation.x -= delta * 0.18;
      innerRingRef.current.rotation.z += delta * 0.22;
    }

    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.3;
      coreRef.current.rotation.z += delta * 0.12;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <group scale={corePulseScale}>
      {/* Ambient & Directional Lighting */}
      <ambientLight intensity={0.7} />
      <pointLight position={[10, 10, 10]} intensity={1.6} color="#818cf8" />
      <pointLight position={[-10, -10, -10]} intensity={1.1} color="#c084fc" />

      {/* Floating 3D Composite */}
      <Float speed={1.5} rotationIntensity={0.25} floatIntensity={0.5}>
        {/* Outer Glowing Torus Ring */}
        <mesh ref={outerRingRef}>
          <torusGeometry args={[2.2, 0.045, 16, 80]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4f46e5"
            emissiveIntensity={1.3}
            roughness={0.15}
            metalness={0.85}
          />
        </mesh>

        {/* Intersecting Secondary Counter-Rotating Torus Ring */}
        <mesh ref={innerRingRef} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
          <torusGeometry args={[1.75, 0.035, 16, 80]} />
          <meshStandardMaterial
            color="#a855f7"
            emissive="#9333ea"
            emissiveIntensity={1.5}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {/* Central Core */}
        <group>
          <mesh ref={coreRef}>
            <icosahedronGeometry args={[1.15, 1]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.9}
              wireframe={true}
            />
          </mesh>

          {/* Inner Pulsing Core */}
          <mesh scale={0.68}>
            <sphereGeometry args={[1, 24, 24]} />
            <MeshWobbleMaterial
              color="#6366f1"
              emissive="#4338ca"
              emissiveIntensity={2}
              factor={0.3}
              speed={1.2}
              roughness={0.1}
            />
          </mesh>
        </group>

        {/* Orbiting 3D Particle Cloud */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[colors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.055}
            vertexColors
            transparent
            opacity={0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      </Float>
    </group>
  );
}

export interface LoopCoreSceneProps {
  mouseRef: React.RefObject<{ x: number; y: number }>;
  isReducedMotion?: boolean;
  corePulseScale?: number;
}

export default function LoopCoreScene({
  mouseRef,
  isReducedMotion = false,
  corePulseScale = 1,
}: LoopCoreSceneProps) {
  const dprCap = useMemo(() => {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio, 1.5);
  }, []);

  return (
    <div className="w-full h-[380px] sm:h-[520px] relative pointer-events-none select-none">
      {/* IMPORTANT: must use explicit height (not h-full or min-h only).
          R3F's internal canvas div uses height:100%, which only resolves when
          the parent has an explicit height property. min-height alone causes
          the canvas to collapse to 0px — the 3D scene becomes invisible. */}
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={dprCap}
      >
        <LoopCoreMesh
          mouseRef={mouseRef}
          isReducedMotion={isReducedMotion}
          corePulseScale={corePulseScale}
        />
      </Canvas>
    </div>
  );
}
