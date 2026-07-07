"use client";

/**
 * CRT / glitch WebGL background scene.
 *
 * ⚠️ BUNDLE ISOLATION CONTRACT ⚠️
 * This is the ONLY file in the repo permitted to statically import `three`
 * and `@react-three/fiber`. It is reachable exclusively through
 * `ThemeWebGLBackground`'s `next/dynamic(..., { ssr:false })` gate, which
 * places three + r3f + this module in a separate lazy chunk that no page or
 * shared chunk references. A general (non-themed) event page therefore never
 * downloads a byte of three. Do NOT import three from anywhere else, and do
 * NOT import this file except via that dynamic gate.
 *
 * This animated background IS the theme, so its motion runs unconditionally
 * (only paused when the tab is hidden). Motion is low-amplitude, small-element
 * horizontal drift/flicker — no large-area luminance strobe — so it stays
 * within epilepsy-safe bounds. The harsher CSS glitch-text and flash overlays
 * remain gated behind `prefers-reduced-motion: no-preference` separately.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    // Fullscreen triangle/quad — position already in clip space.
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;   // 0 under reduced-motion => frozen frame
  uniform vec2  uResolution;
  uniform vec3  uGlow;        // phosphor tint (theme accent)

  // Cheap hash noise.
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // Barrel distortion — curve the flat image onto a rounded CRT tube.
  vec2 barrel(vec2 uv, float amt) {
    vec2 c = uv * 2.0 - 1.0;
    float r2 = dot(c, c);
    c *= 1.0 + amt * r2;
    return c * 0.5 + 0.5;
  }

  // One horizontal laser channel: an occasional beam that ZAPS across from the
  // left or right edge (thin bright line + brighter head), then fades out. Off
  // most of the time so it stays infrequent and calm.
  float laser(vec2 uv, float t, float id) {
    float period = 1.25 + hash(vec2(id, 1.0)) * 1.5;  // 1.25–2.75s between zaps (4x)
    float phase = hash(vec2(id, 2.0)) * period;
    float cyc = floor((t + phase) / period);          // which zap
    float lt = fract((t + phase) / period);           // 0..1 through the cycle
    float win = 0.14;                                  // short = quick zap
    float fire = step(lt, win);
    float p = clamp(lt / win, 0.0, 1.0);               // sweep progress
    float ease = 1.0 - pow(1.0 - p, 3.0);              // fast-in, ease-out

    float dir = step(0.5, hash(vec2(id, cyc + 3.0)));  // 0 = L→R, 1 = R→L
    float y = 0.12 + 0.76 * hash(vec2(id, cyc + 7.0)); // beam row (new each zap)
    float head = dir > 0.5 ? 1.0 - ease : ease;        // head x-position

    // Bright thin core + a soft glowing halo above/below it (glowy beam).
    float dy = abs(uv.y - y);
    float core = smoothstep(0.005, 0.0, dy);
    float halo = smoothstep(0.055, 0.0, dy) * 0.55;
    float yProfile = core + halo;

    // Trail: lit from the origin edge up to the head, fading toward the origin.
    float behind = dir > 0.5 ? step(head, uv.x) : step(uv.x, head);
    float trail = behind * (1.0 - abs(uv.x - head)) * 0.8;
    float headGlow = smoothstep(0.05, 0.0, abs(uv.x - head)) * 1.8;

    return fire * yProfile * (trail + headGlow);
  }

  void main() {
    // CRT warp: distort UVs so the picture bulges like a tube (rounded edges).
    vec2 uv = barrel(vUv, 0.18);
    float t = uTime * uIntensity;

    // Backdrop colour (#231f20).
    vec3 bg = vec3(0.1373, 0.1216, 0.1255);
    vec3 col = bg;

    // ── Lasers zapping in from the sides ──
    float beams = 0.0;
    beams += laser(uv, t, 0.0);
    beams += laser(uv, t, 1.0);
    beams += laser(uv, t, 2.0);
    // Bright yellow (#dadb00) beams + room glow with additive bloom.
    vec3 laserColor = vec3(0.855, 0.859, 0.0);
    col += laserColor * beams * 0.55;

    // ── TV noise (stronger animated static) ──
    float tv = hash(uv * uResolution.xy + floor(t * 24.0));
    col += vec3(tv - 0.5) * 0.16;

    // Gentle whole-field CRT flicker — slow.
    float gFlick = 0.9 + 0.1 * hash(vec2(floor(t * 1.2), 7.0));
    col *= gFlick;

    // Rounded CRT tube mask: keep the area beyond the curved screen black.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.02), uv) *
                smoothstep(vec2(1.0), vec2(0.98), uv);
    float tube = edge.x * edge.y;
    col *= tube;

    // Vignette for CRT depth.
    vec2 vc = uv * 2.0 - 1.0;
    col *= 1.0 - 0.22 * dot(vc, vc);

    // Pulsing yellow BLOOM in the "room" AROUND the screen (the bezel area
    // beyond the curved edge), fading out from the screen edge — slow pulse.
    float edgeDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float outDist = max(0.0, -edgeDist);           // >0 only outside the screen
    float roomBloom = smoothstep(0.42, 0.0, outDist) * (1.0 - tube);
    float pulse = 0.5 + 0.5 * sin(uTime * 0.6);    // slow (~10s period)
    col += laserColor * roomBloom * pulse * 0.9;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Scattered RAVEON logo instances that all point toward the mouse.
 *
 * Performance: ONE InstancedMesh (single draw call for every logo), a static
 * count, a dynamic instanceMatrix buffer, and per-frame work that is only
 * `count` quaternion slerps + matrix composes — no per-instance React, no
 * per-instance draw calls. The GLB geometry is baked/centered once.
 */
/** Beat tempo the instances pulse to. 60 to start; techno lives at ~130–140. */
const RAVEON_BPM = 60;

/** Max tilt away from facing the viewer — never show more than this per side. */
const RAVEON_MAX_TILT = THREE.MathUtils.degToRad(30);
const RAVEON_FORWARD = new THREE.Vector3(0, 0, 1);

function RaveonInstances({ isMobile }: { isMobile: boolean }) {
  const gltf = useLoader(GLTFLoader, "/models/raveon3d.glb");
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();
  const count = isMobile ? 14 : 40;

  // Mouse in NDC. The canvas is pointer-events-none, so r3f's own pointer
  // events never fire — track the window instead.
  const pointer = useRef({ x: 0, y: 0, active: false });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.current.active = true;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Bake the source mesh's transform into a centered, unit-scaled geometry
  // whose thinnest axis (the logo's face normal) is +Z, so lookAt() points
  // the face at the target.
  const geometry = useMemo(() => {
    let src: THREE.Mesh | null = null;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (!src && (o as THREE.Mesh).isMesh) src = o as THREE.Mesh;
    });
    if (!src) return new THREE.BufferGeometry();
    const geo = (src as THREE.Mesh).geometry.clone();
    geo.applyMatrix4((src as THREE.Mesh).matrixWorld);
    geo.computeBoundingBox();
    const size = geo.boundingBox!.getSize(new THREE.Vector3());
    if (size.y <= size.x && size.y <= size.z) geo.rotateX(Math.PI / 2);
    else if (size.x <= size.y && size.x <= size.z) geo.rotateY(Math.PI / 2);
    geo.center();
    geo.computeBoundingBox();
    const s = geo.boundingBox!.getSize(new THREE.Vector3());
    geo.scale(1 / Math.max(s.x, s.y, s.z), 1 / Math.max(s.x, s.y, s.z), 1);
    geo.computeVertexNormals();
    return geo;
  }, [gltf]);

  // Static per-instance scatter: position inside the camera frustum (wider
  // spread at greater depth), scale, roll offset/speed, turn responsiveness.
  const instances = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = Math.max(cam.aspect || 1.7, 1);
    const tanFov = Math.tan(((cam.fov || 40) * Math.PI) / 360);
    return Array.from({ length: count }, () => {
      const z = -14 + Math.random() * 16; // depth: -14 … +2
      const halfH = tanFov * (cam.position.z - z) * 1.1;
      return {
        position: new THREE.Vector3(
          (Math.random() * 2 - 1) * halfH * aspect,
          (Math.random() * 2 - 1) * halfH,
          z
        ),
        scale: (1.4 + Math.random() * 2.2) * 0.75,
        roll: Math.random() * Math.PI * 2,
        rollSpeed: (Math.random() - 0.5) * 0.3,
        turn: 3 + Math.random() * 3,
        quaternion: new THREE.Quaternion(),
        // Beat response: how hard this instance kicks/shakes, and a random
        // shake direction + frequency so the field doesn't move in unison.
        pulseAmp: 0.1 + Math.random() * 0.14,
        shakeAmp: 0.06 + Math.random() * 0.14,
        shakeDir: new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize(),
        shakeFreq: 18 + Math.random() * 14,
        shakePhase: Math.random() * Math.PI * 2,
        // ~40% of instances get a darker tint (multiplies the material colour).
        shade: Math.random() < 0.4 ? 0.35 + Math.random() * 0.35 : 1,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const lookDir = useMemo(() => new THREE.Vector3(), []);
  const tiltAxis = useMemo(() => new THREE.Vector3(), []);
  const tiltQuat = useMemo(() => new THREE.Quaternion(), []);

  // Yellow theme material (Lambert = cheapest lit shading) with a beat-driven
  // vertex "dismorph" patched in: on each kick the surface ripples along its
  // normals, easing back to the clean shape as the beat envelope decays.
  const beatUniforms = useMemo(
    () => ({ uBeat: { value: 0 }, uTime: { value: 0 } }),
    []
  );
  const material = useMemo(() => {
    const mat = new THREE.MeshLambertMaterial({
      color: "#d9e020",
      emissive: "#d9e020",
      emissiveIntensity: 0.18,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uBeat = beatUniforms.uBeat;
      shader.uniforms.uTime = beatUniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform float uBeat;
           uniform float uTime;`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           // Beat dismorph: cheap layered sine ripple along the normal,
           // scaled by the eased beat envelope (0 between beats).
           float dm = sin(position.x * 7.0 + uTime * 5.0) *
                      sin(position.y * 9.0 + uTime * 3.7) +
                      0.5 * sin((position.x + position.y) * 13.0 - uTime * 6.0);
           transformed += normal * dm * uBeat * 0.05;`
        );
    };
    return mat;
  }, [beatUniforms]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    meshRef.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

  // Per-instance shade: instanceColor multiplies the material colour, so the
  // darker instances read as dimmer yellow while staying in one draw call.
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const c = new THREE.Color();
    instances.forEach((inst, i) => mesh.setColorAt(i, c.setScalar(inst.shade)));
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instances]);

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;

    // World-space look target: the mouse ray intersected with the z=6 plane
    // (in front of every instance), or a slow drifting point on touch devices.
    if (pointer.current.active) {
      target.set(pointer.current.x, pointer.current.y, 0.5).unproject(camera);
      target.sub(camera.position).normalize();
      const dist = (6 - camera.position.z) / target.z;
      target.multiplyScalar(dist).add(camera.position);
    } else {
      target.set(Math.sin(t * 0.3) * 7, Math.cos(t * 0.23) * 4, 6);
    }

    // Beat envelope: instant kick on the beat, eased (cubic) decay back to 0.
    const beatT = (t * RAVEON_BPM) / 60;
    const env = Math.pow(1 - (beatT % 1), 3);
    beatUniforms.uBeat.value = env;
    beatUniforms.uTime.value = t;
    // The glow breathes with the beat too.
    material.emissiveIntensity = 0.18 + env * 0.35;

    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      // Shake: high-frequency jitter along a per-instance direction, gated by
      // the beat envelope so it hits on the kick and settles between beats.
      const shake =
        Math.sin(t * inst.shakeFreq + inst.shakePhase) * inst.shakeAmp * env;
      dummy.position
        .copy(inst.position)
        .addScaledVector(inst.shakeDir, shake * inst.scale);
      // Clamp the look direction to a cone around "facing the viewer": if the
      // target sits more than RAVEON_MAX_TILT off the forward axis, rotate
      // forward only that far toward it, so no side ever turns past 15°.
      lookDir.subVectors(target, dummy.position).normalize();
      const tilt = lookDir.angleTo(RAVEON_FORWARD);
      if (tilt > RAVEON_MAX_TILT) {
        tiltAxis.crossVectors(RAVEON_FORWARD, lookDir);
        if (tiltAxis.lengthSq() > 1e-10) {
          tiltAxis.normalize();
          lookDir
            .copy(RAVEON_FORWARD)
            .applyQuaternion(
              tiltQuat.setFromAxisAngle(tiltAxis, RAVEON_MAX_TILT)
            );
        } else {
          lookDir.copy(RAVEON_FORWARD);
        }
      }
      dummy.lookAt(lookDir.add(dummy.position));
      dummy.rotateZ(inst.roll + t * inst.rollSpeed);
      // Frame-rate-independent smoothing toward the desired orientation.
      inst.quaternion.slerp(dummy.quaternion, 1 - Math.exp(-inst.turn * dt));
      dummy.quaternion.copy(inst.quaternion);
      // Resize: pump up on the kick, ease back down with the envelope.
      dummy.scale.setScalar(inst.scale * (1 + env * inst.pulseAmp));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      renderOrder={1}
    />
  );
}

function CrtPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uGlow: { value: new THREE.Color("#d8e600") },
    }),
    []
  );

  useEffect(() => {
    uniforms.uResolution.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr
    );
  }, [size.width, size.height, viewport.dpr, uniforms]);

  // Advance time every frame — this is the whole point of the theme, so it runs
  // unconditionally (the frameloop is only paused when the tab is hidden).
  useFrame((state) => {
    const mat = materialRef.current;
    if (mat) mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function CrtScene() {
  const [isMobile, setIsMobile] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mob = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mob.matches);
    sync();
    mob.addEventListener("change", sync);

    // Pause the render loop while the tab is backgrounded — no wasted GPU.
    const onVisibility = () => setHidden(document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mob.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (!mounted) return null;

  // Rendered as a true page background via a portal to <body>: a fixed,
  // z-index:-1 canvas that sits behind ALL app content and behind the page
  // frame (so the frame's border and translucent/blurred panel show on top of
  // it). Portalling out of the content tree also avoids any ancestor becoming
  // a containing block for this fixed element.
  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: -1 }}
    >
      <Canvas
        frameloop={hidden ? "never" : "always"}
        dpr={[1, isMobile ? 1.25 : 1.75]}
        gl={{ antialias: false, powerPreference: "low-power" }}
        // Perspective camera for the 3D logo instances; the CRT plane writes
        // clip-space positions directly, so it ignores the camera either way.
        camera={{ position: [0, 0, 16], fov: 40, near: 0.1, far: 60 }}
      >
        {/* Distant instances fade into the CRT backdrop colour. */}
        <fog attach="fog" args={["#231f20", 16, 34]} />
        <CrtPlane />
        <ambientLight intensity={0.55} />
        <directionalLight position={[5, 8, 10]} intensity={1.4} />
        <Suspense fallback={null}>
          <RaveonInstances isMobile={isMobile} />
        </Suspense>
      </Canvas>
    </div>,
    document.body
  );
}
