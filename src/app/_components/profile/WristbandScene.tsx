"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "/models/wristband.glb";

/** Material names in the GLB — match the StickerCodeProperty enum in the DB. */
export type WristbandColor =
  | "Festival26Black"
  | "Festival26Red"
  | "Festival26Blue";

const COLOR_CYCLE: WristbandColor[] = [
  "Festival26Red",
  "Festival26Blue",
  "Festival26Black",
];
const COLOR_CYCLE_SECONDS = 2.5;
const FALLBACK_COLOR: WristbandColor = "Festival26Red";

/** How long the roll-in lasts, and how many turns the band makes. */
const ROLL_DURATION = 1.5;
const ROLL_TURNS = 2.5;
const ROLL_FROM_X = -3.2;

/** Resting pose: slight tilt so the band reads as a 3D object, not a flat ring. */
const REST_TILT_X = 0.45;

/** Idle spin speed (rad/s) — also runs during the roll-in so the spin never stops. */
const IDLE_SPIN = 0.6;

// easeOutCubic — no overshoot, so the roll-in spin never reverses direction.
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function WristbandModel({
  reducedMotion,
  entrance,
  color,
}: {
  reducedMotion: boolean;
  entrance: boolean;
  color: WristbandColor | null;
}) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const groupRef = useRef<THREE.Group>(null);
  const startRef = useRef<number | null>(null);

  // Center + normalize the export once so framing is stable regardless of how
  // the GLB was authored.
  const { model, band, palette } = useMemo(() => {
    const root = gltf.scene.clone(true);

    // Harvest every band material by name (the DB enum matches material
    // names) — including the ones only present on the hidden
    // __materialHolder plane.
    const colorPalette = new Map<string, THREE.Material>();
    root.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const list = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const m of list) {
        if (m?.name?.startsWith("Festival26") && !colorPalette.has(m.name)) {
          colorPalette.set(m.name, m);
        }
      }
    });

    // Hidden plane whose only job is to keep the unassigned band materials
    // in the export — drop it so it can't skew framing.
    root.getObjectByName("__materialHolder")?.removeFromParent();

    // The band mesh whose material we swap per wristband color.
    let bandMesh: THREE.Mesh | null = null;
    root.getObjectByName("Band")?.traverse(o => {
      if (!bandMesh && (o as THREE.Mesh).isMesh) bandMesh = o as THREE.Mesh;
    });

    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 3.75 / Math.max(size.x, size.y, size.z);

    const wrapper = new THREE.Group();
    root.position.sub(center);
    wrapper.scale.setScalar(scale);
    // The GLB's ring axis points at the camera; turn it 90° so the band
    // starts upright facing the viewer, outer surface out.
    wrapper.rotation.x = Math.PI / 2;
    wrapper.add(root);

    return {
      model: wrapper,
      band: bandMesh as THREE.Mesh | null,
      palette: colorPalette,
    };
  }, [gltf]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;
    if (startRef.current === null) startRef.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startRef.current;

    // A known DB color pins the band material; unknown cycles the palette.
    const desired =
      color ??
      COLOR_CYCLE[
        Math.floor(clock.elapsedTime / COLOR_CYCLE_SECONDS) %
          COLOR_CYCLE.length
      ];
    const nextMaterial = palette.get(desired) ?? palette.get(FALLBACK_COLOR);
    if (band && nextMaterial && band.material !== nextMaterial) {
      band.material = nextMaterial;
    }

    // The idle spin runs from frame one; the roll-in only adds extra turns on
    // top of it that decay to zero, so the spin flows through the landing
    // without stopping or reversing.
    const spin = IDLE_SPIN * elapsed;

    if (reducedMotion) {
      group.position.set(0, 0, 0);
      group.rotation.set(REST_TILT_X, 0, 0);
    } else if (entrance && elapsed < ROLL_DURATION) {
      const t = easeOutCubic(Math.min(elapsed / ROLL_DURATION, 1));
      const x = THREE.MathUtils.lerp(ROLL_FROM_X, 0, t);
      group.position.set(x, 0, 0);
      group.rotation.set(
        THREE.MathUtils.lerp(0, REST_TILT_X, t),
        (x / -ROLL_FROM_X) * ROLL_TURNS * Math.PI * 2 + spin,
        0
      );
    } else {
      // Idle: slow turn + gentle float.
      group.position.x = 0;
      group.position.y = Math.sin(clock.elapsedTime * 1.2) * 0.04;
      group.rotation.x = REST_TILT_X + Math.sin(clock.elapsedTime * 0.7) * 0.05;
      group.rotation.z = 0;
      group.rotation.y = spin;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}

export type SceneStatus = "none" | "success" | "error";

/**
 * Wristband code floating in the middle of the band while there is no status
 * icon — the icon takes over the same spot on success/error. Waits out the
 * roll-in (`delay`), then fades in once the band has settled in the center.
 */
function CodeLabel({ label, delay }: { label: string; delay: number }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const materialRef = useRef<THREE.SpriteMaterial>(null);
  const startRef = useRef<number | null>(null);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font =
      "700 96px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    // Soft dark halo so the white text stays readable over the band.
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, 256, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [label]);

  useFrame(({ clock }) => {
    // `delay` is measured from scene start (the roll-in runs on the same
    // clock), so a label that mounts late — preview fetch slower than the
    // roll — still fades in right away instead of waiting the delay again.
    if (startRef.current === null) {
      startRef.current = Math.max(clock.elapsedTime, delay);
    }
    const elapsed = clock.elapsedTime - startRef.current;
    const t = THREE.MathUtils.clamp(elapsed / 0.6, 0, 1);
    const fade = easeOutCubic(t);
    if (materialRef.current) materialRef.current.opacity = fade;
    // Gentle settle from slightly small, so the fade has some life to it.
    const scale = 0.92 + 0.08 * fade;
    // Canvas is 2:1, keep the sprite the same so glyphs aren't stretched.
    spriteRef.current?.scale.set(2.4 * scale, 1.2 * scale, 1);
    if (spriteRef.current) spriteRef.current.visible = t > 0;
  });

  return (
    <sprite ref={spriteRef} visible={false}>
      <spriteMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </sprite>
  );
}

// easeOutBack — pops in with a small overshoot, so the icon feels stamped on.
function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

const STATUS_COLORS: Record<Exclude<SceneStatus, "none">, string> = {
  success: "#34d399",
  error: "#f87171",
};

/**
 * Check / cross floating in the middle of the band: success when the band is
 * (or already was) linked to this account, error when it belongs elsewhere.
 */
function StatusIcon({ status }: { status: Exclude<SceneStatus, "none"> }) {
  const spriteRef = useRef<THREE.Sprite>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const startRef = useRef<number | null>(null);
  const color = STATUS_COLORS[status];

  // Soft colored glow disc with a thick rounded icon stroke on top.
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    const glow = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    glow.addColorStop(0, `${color}59`); // ~35% alpha
    glow.addColorStop(0.6, `${color}1f`);
    glow.addColorStop(1, `${color}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = color;
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (status === "success") {
      ctx.moveTo(78, 134);
      ctx.lineTo(116, 170);
      ctx.lineTo(182, 92);
    } else {
      ctx.moveTo(94, 94);
      ctx.lineTo(162, 162);
      ctx.moveTo(162, 94);
      ctx.lineTo(94, 162);
    }
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [status, color]);

  useFrame(({ clock }) => {
    if (startRef.current === null) startRef.current = clock.elapsedTime;
    const elapsed = clock.elapsedTime - startRef.current;
    const pop = easeOutBack(Math.min(elapsed / 0.45, 1));
    const breathe = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.04;
    spriteRef.current?.scale.setScalar(1.5 * Math.max(pop, 0) * breathe);
    if (lightRef.current) {
      lightRef.current.intensity =
        (2.5 + Math.sin(clock.elapsedTime * 2.2) * 0.8) * Math.max(pop, 0);
    }
  });

  return (
    <group>
      <pointLight ref={lightRef} color={color} distance={5} decay={2} />
      <sprite ref={spriteRef} scale={0}>
        <spriteMaterial map={texture} transparent depthWrite={false} />
      </sprite>
    </group>
  );
}

interface Props {
  reducedMotion?: boolean;
  /** Center icon: check when linked to this account, cross when taken. */
  status?: SceneStatus;
  /** Play the roll-in intro. Off = start at rest, spinning. */
  entrance?: boolean;
  /** DB wristband color. Omit/null when unknown — the band cycles colors. */
  color?: WristbandColor | null;
  /** Scanned wristband code shown in the band center while status is none. */
  label?: string | null;
  className?: string;
}

/** 3D stage for the wristband link modal. Client-only; dynamic-import it. */
export default function WristbandScene({
  reducedMotion = false,
  status = "none",
  entrance = true,
  color = null,
  label = null,
  className,
}: Props) {
  return (
    <Canvas
      className={className}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 32, position: [0, 0.3, 5.2] }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.5} />
      {status !== "none" ? (
        <StatusIcon key={status} status={status} />
      ) : (
        label && (
          <CodeLabel
            key={label}
            label={label}
            // Hold until the roll-in lands the band in the center.
            delay={entrance && !reducedMotion ? ROLL_DURATION + 0.25 : 0}
          />
        )
      )}
      <Suspense fallback={null}>
        <WristbandModel
          reducedMotion={reducedMotion}
          entrance={entrance}
          color={color}
        />
      </Suspense>
    </Canvas>
  );
}
