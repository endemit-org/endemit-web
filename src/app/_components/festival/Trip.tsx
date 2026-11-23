"use client";

import { useEffect, useRef } from "react";
import styles from "./festival.module.css";

const VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

// Kaleidoscope-folded Kaliset fractal in the festival palette, posterised so
// it reads as print, and redrawn in steps like the hand-drawn type.
const FRAGMENT = `
precision mediump float;
uniform vec2 r;
uniform float t;
uniform float p;
vec3 pal(float x) {
  vec3 a = vec3(0.047, 0.039, 0.27);
  vec3 b = vec3(0.93, 0.23, 0.31);
  vec3 c = vec3(0.96, 0.65, 0.56);
  vec3 d = vec3(0.66, 0.61, 0.92);
  x = fract(x) * 4.0;
  if (x < 1.0) return mix(a, b, x);
  if (x < 2.0) return mix(b, c, x - 1.0);
  if (x < 3.0) return mix(c, d, x - 2.0);
  return mix(d, a, x - 3.0);
}
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - r) / min(r.x, r.y);
  uv *= 1.25 - p * 0.55;
  float ang = atan(uv.y, uv.x) + t * 0.05 + p * 1.2;
  float len = length(uv);
  float seg = 6.28318 / 6.0;
  ang = abs(mod(ang, seg) - seg * 0.5);
  vec2 z = len * vec2(cos(ang), sin(ang));
  float acc = 0.0;
  for (int i = 0; i < 6; i++) {
    z = abs(z) / max(dot(z, z), 0.02) - vec2(0.82 + 0.2 * sin(t * 0.11), 0.48 + 0.42 * p);
    acc += exp(-3.2 * abs(length(z) - 0.62));
  }
  vec3 col = pal(acc * 0.2 + len * 0.28 - t * 0.04 + p * 0.6);
  col = floor(col * 5.0 + 0.5) / 5.0;
  gl_FragColor = vec4(col, 1.0);
}`;

/** A band that turns fractal as it is scrolled through. Falls back to CSS. */
export default function Trip({ word }: { word: string }) {
  const band = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = band.current;
    const view = canvas.current;
    if (!host || !view) return;
    const root = host.closest<HTMLElement>("[data-lite]");
    if (root?.dataset.lite === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const gl = view.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uResolution = gl.getUniformLocation(program, "r");
    const uTime = gl.getUniformLocation(program, "t");
    const uProgress = gl.getUniformLocation(program, "p");
    host.dataset.live = "true";

    // Drawn small and scaled up by CSS: the posterised look hides it.
    const resize = () => {
      const scale = Math.min(1, 520 / host.clientWidth);
      view.width = Math.max(2, Math.round(host.clientWidth * scale));
      view.height = Math.max(2, Math.round(host.clientHeight * scale));
      gl.viewport(0, 0, view.width, view.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let last = -1;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      // Twelve drawings a second.
      const tick = Math.floor(now / 83);
      if (tick === last) return;
      last = tick;
      const rect = host.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      host.style.setProperty("--trip", progress.toFixed(3));
      gl.uniform2f(uResolution, view.width, view.height);
      gl.uniform1f(uTime, tick / 12);
      gl.uniform1f(uProgress, progress);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const observer = new IntersectionObserver(([entry]) => {
      cancelAnimationFrame(frame);
      if (entry.isIntersecting) frame = requestAnimationFrame(draw);
    });
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div ref={band} className={styles.trip} aria-hidden>
      <canvas ref={canvas} />
      <div className={styles.tripWords}>
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} style={{ "--i": i } as React.CSSProperties}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
