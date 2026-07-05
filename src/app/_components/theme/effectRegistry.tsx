/**
 * Client-safe registries mapping the JSON-serializable string ids carried in a
 * PageThemeConfig to real components. The theme config itself stays pure data
 * (crosses the RSC → client boundary); heavy/client-only pieces are resolved
 * here by id. Heavy effects should be pulled in via `next/dynamic` so they
 * stay out of the general-page bundle.
 */

import type { ComponentType, ReactNode } from "react";
import GlitchText from "@/app/_components/theme/GlitchText";

/**
 * Heading text-effect renderers, keyed by `PageThemeConfig.headingEffect`.
 * A renderer wraps a plain string heading in its effect markup.
 */
const headingEffects: Record<
  string,
  (text: string, className?: string) => ReactNode
> = {
  glitch: (text, className) => (
    <GlitchText className={className}>{text}</GlitchText>
  ),
};

/**
 * Render a heading through the theme's headingEffect, if any. Falls back to the
 * raw string when the effect id is absent or unknown — a purely-CSS theme (or
 * general) is unaffected.
 */
export function renderHeadingEffect(
  effectId: string | null | undefined,
  text: string,
  className?: string
): ReactNode {
  if (!effectId) return text;
  const fx = headingEffects[effectId];
  return fx ? fx(text, className) : text;
}

/**
 * Components for `{ kind: "component" }` effect layers, keyed by layer id.
 * Register future decorative layers (snowfall, embers…) here; wrap heavy ones
 * in `next/dynamic` so they only load on themes that use them.
 */
export const layerComponents: Record<string, ComponentType> = {};
