import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  RoundedBox,
  MeshDistortMaterial,
  Environment,
  Lightformer,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

/**
 * HeroExperience — a fully procedural react-three-fiber scene.
 *
 * No binary assets are used: every shape is generated from primitive geometry,
 * every material is shader/standard based, lighting comes from `<Lightformer>`
 * panels rendered into an in-memory cube (no .hdr files), and the particle
 * field is `<Sparkles>` (procedurally drawn points). The concept maps to the
 * product: frosted-glass "document" panels orbit a glowing AI core while data
 * sparkles drift through the warm light.
 *
 * Props:
 *   reduceMotion — freeze all animation (prefers-reduced-motion).
 *   variant      — "hero" (full) | "cta" (lighter, used in the bottom band).
 *   paused       — when true the render loop runs on-demand only (offscreen).
 */

const PALETTE = {
  core: "#ff8a1e",
  coreEmissive: "#ff4d00",
  glow: "#ff6a00",
  panel: "#fff3e4",
  attenuation: "#ffae5e",
  metalDark: "#1a120b",
};

// ---- Capability detection (so low/no-GPU devices still get a clean page) ----

function detectWebGL() {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

// Heuristic for weak hardware (few cores / little memory) → render a lighter
// scene: lower resolution, no shadows/antialias, cheaper materials.
function detectLowPower() {
  if (typeof navigator === "undefined") return false;
  const mem = navigator.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (
    (typeof mem === "number" && mem <= 4) ||
    (typeof cores === "number" && cores <= 4)
  );
}

// Pure-CSS fallback shown when WebGL is unavailable or the canvas errors. It
// mirrors the dark hero with a warm glow where the 3D core would sit, so the
// layout and copy on top stay perfectly legible.
function Fallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(circle at 60% 44%, rgba(255,138,26,0.55), rgba(255,77,0,0.18) 28%, rgba(12,8,5,0) 58%)," +
          "radial-gradient(circle at 28% 72%, rgba(111,155,255,0.16), transparent 45%)," +
          "#0c0805",
      }}
    />
  );
}

// Catches any runtime error from the WebGL canvas (e.g. context creation
// failure) and swaps in the CSS fallback instead of blanking the page.
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallow — fallback is rendered instead */
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// The glowing, gently morphing AI core at the centre of the composition.
function Core({ reduceMotion, radius = 1.05 }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (reduceMotion || !ref.current) return;
    ref.current.rotation.y += delta * 0.12;
    ref.current.rotation.x += delta * 0.04;
  });
  return (
    <Float
      speed={reduceMotion ? 0 : 1.1}
      rotationIntensity={reduceMotion ? 0 : 0.5}
      floatIntensity={reduceMotion ? 0 : 1.1}
    >
      <mesh ref={ref} castShadow>
        <icosahedronGeometry args={[radius, 18]} />
        <MeshDistortMaterial
          color={PALETTE.core}
          emissive={PALETTE.coreEmissive}
          emissiveIntensity={0.35}
          roughness={0.12}
          metalness={0.65}
          distort={0.38}
          speed={reduceMotion ? 0 : 1.4}
        />
      </mesh>
      {/* Soft additive halo — cheap bloom stand-in (no postprocessing pass). */}
      <mesh scale={1.5}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color={PALETTE.glow}
          transparent
          opacity={0.11}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </Float>
  );
}

// A frosted-glass document panel. On capable GPUs MeshPhysicalMaterial
// transmission gives a single-pass glass look; on weak hardware we fall back to
// a cheap translucent standard material that reads the same but costs nothing.
function Panel({ position, rotation, scale, reduceMotion, floatSeed, lowPower }) {
  return (
    <Float
      speed={reduceMotion ? 0 : 0.9 + floatSeed * 0.4}
      rotationIntensity={reduceMotion ? 0 : 0.4}
      floatIntensity={reduceMotion ? 0 : 0.8 + floatSeed * 0.5}
    >
      <RoundedBox
        args={[1.35, 1.85, 0.07]}
        radius={0.09}
        smoothness={lowPower ? 2 : 4}
        position={position}
        rotation={rotation}
        scale={scale}
        castShadow={!lowPower}
      >
        {lowPower ? (
          <meshStandardMaterial
            color={PALETTE.panel}
            roughness={0.25}
            metalness={0.1}
            transparent
            opacity={0.6}
          />
        ) : (
          <meshPhysicalMaterial
            color={PALETTE.panel}
            transmission={0.94}
            thickness={0.6}
            roughness={0.12}
            ior={1.4}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0.15}
            attenuationColor={PALETTE.attenuation}
            attenuationDistance={1.6}
            transparent
            opacity={0.92}
          />
        )}
      </RoundedBox>
    </Float>
  );
}

// Small metallic accent solids that catch the warm rim light.
function Accent({ geometry, position, color, reduceMotion, floatSeed }) {
  return (
    <Float
      speed={reduceMotion ? 0 : 1.2 + floatSeed}
      rotationIntensity={reduceMotion ? 0 : 1.4}
      floatIntensity={reduceMotion ? 0 : 1.6}
    >
      <mesh position={position} castShadow>
        {geometry}
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.25} />
      </mesh>
    </Float>
  );
}

// Subtle parallax: the whole group leans toward the pointer. Driven by a window
// listener so it keeps working even with DOM content layered on top.
function Rig({ children, reduceMotion, strength = 0.32 }) {
  const ref = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  useEffect(() => {
    if (reduceMotion) return undefined;
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion]);
  useFrame(() => {
    if (reduceMotion || !ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      mouse.current.x * strength,
      0.04,
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      mouse.current.y * strength * 0.55,
      0.04,
    );
  });
  return <group ref={ref}>{children}</group>;
}

function Scene({ reduceMotion, variant, lowPower }) {
  const isCta = variant === "cta";

  const panels = useMemo(() => {
    const all = [
      {
        position: [-2.55, 0.45, -0.6],
        rotation: [0.18, 0.55, 0.12],
        scale: 1.05,
        floatSeed: 0.2,
      },
      {
        position: [2.65, -0.35, -0.4],
        rotation: [-0.2, -0.6, -0.15],
        scale: 0.95,
        floatSeed: 0.6,
      },
      {
        position: [0.2, 1.9, -1.4],
        rotation: [0.4, 0.1, 0.3],
        scale: 0.78,
        floatSeed: 0.9,
      },
    ];
    const count = isCta || lowPower ? 2 : 3;
    return all.slice(0, count);
  }, [isCta, lowPower]);

  const sparkleCount = lowPower ? (isCta ? 18 : 30) : isCta ? 40 : 70;

  return (
    <>
      <color attach="background" args={["#0c0805"]} />
      <fog attach="fog" args={["#0c0805", 7, 16]} />

      <ambientLight intensity={0.35} />
      <directionalLight
        position={[5, 6, 4]}
        intensity={2.2}
        color="#ffd9a8"
        castShadow={!isCta && !lowPower}
      />
      <pointLight
        position={[0, 0, 2]}
        intensity={6}
        color={PALETTE.glow}
        distance={9}
      />
      <pointLight
        position={[-4, -3, 2]}
        intensity={2}
        color="#7aa7ff"
        distance={12}
      />

      <Rig reduceMotion={reduceMotion} strength={isCta ? 0.18 : 0.32}>
        <Core reduceMotion={reduceMotion} radius={isCta ? 0.85 : 1.05} />

        {panels.map((p, i) => (
          <Panel key={i} reduceMotion={reduceMotion} lowPower={lowPower} {...p} />
        ))}

        <Accent
          geometry={<octahedronGeometry args={[0.42, 0]} />}
          position={[-1.7, -1.6, 0.6]}
          color={PALETTE.core}
          reduceMotion={reduceMotion}
          floatSeed={0.3}
        />
        {!isCta && !lowPower && (
          <>
            <Accent
              geometry={<torusKnotGeometry args={[0.32, 0.12, 120, 16]} />}
              position={[2.1, 1.7, 0.4]}
              color="#3a2a1c"
              reduceMotion={reduceMotion}
              floatSeed={0.7}
            />
            <Accent
              geometry={<dodecahedronGeometry args={[0.36, 0]} />}
              position={[1.5, -1.9, 1]}
              color={PALETTE.core}
              reduceMotion={reduceMotion}
              floatSeed={0.5}
            />
          </>
        )}

        <Sparkles
          count={sparkleCount}
          scale={[10, 7, 6]}
          size={2.4}
          speed={reduceMotion ? 0 : 0.35}
          opacity={0.7}
          color="#ffcf99"
        />
      </Rig>

      {/* Procedural lighting environment — Lightformer panels rendered to an
          in-memory cube. No .hdr / image files involved. */}
      <Environment
        resolution={lowPower ? 128 : 256}
        frames={reduceMotion || lowPower ? 1 : Infinity}
      >
        <color attach="background" args={["#0c0805"]} />
        <Lightformer
          form="rect"
          intensity={3}
          color="#ff8a3a"
          position={[3, 2, 4]}
          scale={[6, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          color="#ffe1b8"
          position={[-4, -1, 3]}
          scale={[5, 5, 1]}
        />
        <Lightformer
          form="ring"
          intensity={2.5}
          color="#6f9bff"
          position={[-2, 3, -4]}
          scale={[4, 4, 1]}
        />
      </Environment>
    </>
  );
}

export default function HeroExperience({
  reduceMotion = false,
  variant = "hero",
  paused = false,
}) {
  const [supported] = useState(detectWebGL);
  const lowPower = useMemo(detectLowPower, []);
  const isCta = variant === "cta";

  // No WebGL at all → clean CSS fallback, no canvas mounted.
  if (!supported) return <Fallback />;

  const maxDpr = lowPower ? 1 : isCta ? 1.4 : 1.6;

  return (
    <CanvasErrorBoundary fallback={<Fallback />}>
      <Canvas
        dpr={[1, maxDpr]}
        shadows={!isCta && !lowPower}
        gl={{
          antialias: !lowPower,
          alpha: false,
          powerPreference: lowPower ? "default" : "high-performance",
          // Allow software (e.g. SwiftShader) rendering on machines without a
          // capable GPU instead of refusing to create a context.
          failIfMajorPerformanceCaveat: false,
        }}
        camera={{ position: [0, 0, isCta ? 7.5 : 6.5], fov: 38 }}
        frameloop={reduceMotion || paused ? "demand" : "always"}
        style={{ position: "absolute", inset: 0, display: "block" }}
        onCreated={({ gl }) => {
          // Keep the page alive across a GPU context loss; let the browser
          // attempt to restore rather than tearing down to a blank canvas.
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => e.preventDefault(),
            false,
          );
        }}
      >
        <Scene reduceMotion={reduceMotion} variant={variant} lowPower={lowPower} />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
