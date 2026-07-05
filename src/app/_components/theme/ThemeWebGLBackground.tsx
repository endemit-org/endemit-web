"use client";

/**
 * Isolation gate for WebGL theme scenes.
 *
 * Each scene is pulled in via `next/dynamic(..., { ssr:false })`, which creates
 * a webpack async boundary: three + r3f + the scene module land in a separate
 * lazy chunk that no page/shared chunk statically references. When `scene` is
 * null we return null and the chunk is never even fetched — general pages pay
 * nothing. `ssr:false` (legal in this client component under Next 15) keeps
 * three off the server entirely.
 */

import dynamic from "next/dynamic";
import type { WebGLSceneId } from "@/domain/event/config/pageThemes";

const scenes = {
  crt: dynamic(() => import("./webgl/CrtScene"), {
    ssr: false,
    loading: () => null,
  }),
} as const;

export default function ThemeWebGLBackground({
  scene,
}: {
  scene: WebGLSceneId | null;
}) {
  if (!scene) return null;
  const Scene = scenes[scene];
  if (!Scene) return null;
  return <Scene />;
}
