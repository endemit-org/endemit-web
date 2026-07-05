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

  void main() {
    // CRT warp: distort UVs so the picture bulges like a tube (rounded edges).
    vec2 uv = barrel(vUv, 0.18);

    // Backdrop colour (#231f20) with sparse yellow BROKEN HORIZONTAL
    // SCANLINE-STREAKS drifting across it (data-mosh look).
    vec3 bg = vec3(0.1373, 0.1216, 0.1255);

    // Slow, calm timebase — the whole backdrop moves lazily.
    float t = uTime * uIntensity;
    float tb = floor(t * 3.0);

    // Finer horizontal rows.
    float rows = 240.0;
    float row = floor(uv.y * rows);

    // Some rows are randomly DEFOCUSED (soft/blurred), the rest crisp.
    float blur = smoothstep(0.5, 1.0, hash(vec2(row, tb + 11.0)));

    // Lit band inside each row cell (gap between rows = the scanline look).
    // Sharp lines are thin; blurred lines are wider and dimmer (defocus look).
    float d = abs(fract(uv.y * rows) - 0.5);
    float lineSharp = smoothstep(0.60, 0.10, d);
    float lineSoft = smoothstep(0.82, 0.05, d) * 0.5;
    float lineY = mix(lineSharp, lineSoft, blur);

    // Per-row continuous horizontal travel — slow drift so lines creep across.
    float travel = (hash(vec2(row, 2.0)) - 0.5) * t * 0.14 * uIntensity;
    // Plus abrupt per-bucket shove (the "tear" jump).
    float shoveRow = step(0.5, hash(vec2(row, tb + 3.0)));
    float shove = shoveRow * (hash(vec2(row, tb)) - 0.5) * 0.4 * uIntensity;
    float x = uv.x + travel + shove;

    // How many rows are lit at once — VERY sparse (~7% of the previous
    // density): only a few horizontal glitch lines visible at a time.
    float envelope = 0.14 + 0.04 * (1.0 - abs(uv.y - 0.5) * 2.0);
    float rowSeed = hash(vec2(row, tb * 0.5 + 1.0));
    float rowActive = step(1.0 - envelope, rowSeed);

    // Broken dashes along the row — softened on defocused rows.
    float segs = 26.0 + 60.0 * hash(vec2(row, 9.0));
    float seg = floor(x * segs);
    float dashRaw = hash(vec2(seg, row + tb));
    float dash = mix(step(0.5, dashRaw), smoothstep(0.42, 0.66, dashRaw), blur);

    // Occasional long streak that glides across.
    float streakRow = step(0.992, hash(vec2(row, floor(t * 0.7))));
    float streakEdge = smoothstep(0.0, 0.05, x) * smoothstep(1.0, 0.8, x);
    float streak = streakRow * streakEdge;

    // Per-dash flicker — slow, calm CRT hiss.
    float flick = 0.55 + 0.45 * hash(vec2(seg, row + floor(t * 2.2)));

    float lit = max(rowActive * dash * flick, streak) * lineY;

    // Gentle whole-field CRT flicker — slow.
    float gFlick = 0.85 + 0.15 * hash(vec2(floor(t * 1.2), 7.0));

    // Yellow lines composited over the #231f20 backdrop.
    vec3 col = (bg + uGlow * lit * 0.95) * gFlick;

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
