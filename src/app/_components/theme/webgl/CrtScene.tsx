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

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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
    // Warm, bright yellow beams with additive glow.
    vec3 laserColor = vec3(1.0, 0.88, 0.12);
    col += laserColor * beams * 0.55;

    // ── TV noise (stronger animated static) ──
    float tv = hash(uv * uResolution.xy + floor(t * 24.0));
    col += vec3(tv - 0.5) * 0.16;

    // Gentle whole-field CRT flicker — slow.
    float gFlick = 0.9 + 0.1 * hash(vec2(floor(t * 1.2), 7.0));
    col *= gFlick;

    // Rounded CRT tube mask: darken the curved edges into a bezel.
    vec2 edge = smoothstep(vec2(0.0), vec2(0.02), uv) *
                smoothstep(vec2(1.0), vec2(0.98), uv);
    float tube = edge.x * edge.y;
    col *= tube;

    // Vignette for CRT depth.
    vec2 vc = uv * 2.0 - 1.0;
    col *= 1.0 - 0.22 * dot(vc, vc);

    gl_FragColor = vec4(col, 1.0);
  }
`;

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
        orthographic
        camera={{ position: [0, 0, 1] }}
      >
        <CrtPlane />
      </Canvas>
    </div>,
    document.body
  );
}
