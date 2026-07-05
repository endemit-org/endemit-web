/**
 * Server wrapper that applies an event page theme.
 *
 * General theme ⇒ a bare fragment: the DOM is byte-identical to the untouched
 * page and no theme code (CSS scope, overlays, WebGL) is in the tree at all.
 *
 * Themed ⇒ a wrapper carrying `data-theme` + token custom-properties, with the
 * theme's background layers rendered behind the content and foreground layers
 * (scanlines, vignette…) above it. Layers are resolved from the JSON-
 * serializable EffectLayer list: `webgl` → the isolated ThemeWebGLBackground
 * gate (three loads only here), `overlay` → a classed div, `component` → the
 * client effect registry. WebGL never enters the tree on general pages, so the
 * three chunk is never fetched.
 */

import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import { EventPageTheme } from "@/domain/event/types/event";
import type {
  EffectLayer,
  PageThemeConfig,
} from "@/domain/event/config/pageThemes";
import ThemeWebGLBackground from "@/app/_components/theme/ThemeWebGLBackground";
import { layerComponents } from "@/app/_components/theme/effectRegistry";

function EffectLayers({ layers }: { layers?: EffectLayer[] }) {
  if (!layers || layers.length === 0) return null;
  return (
    <>
      {layers.map((layer, i) => {
        const style: CSSProperties | undefined =
          layer.z != null ? { zIndex: layer.z } : undefined;

        if (layer.kind === "webgl") {
          return <ThemeWebGLBackground key={`webgl-${i}`} scene={layer.scene} />;
        }
        if (layer.kind === "overlay") {
          return (
            <div
              key={`overlay-${i}`}
              aria-hidden="true"
              className={layer.className}
              style={style}
            />
          );
        }
        // kind === "component"
        const Comp = layerComponents[layer.id];
        if (!Comp) return null;
        return (
          <div key={`component-${i}`} aria-hidden="true" style={style}>
            <Comp />
          </div>
        );
      })}
    </>
  );
}

export default function ThemedEventPage({
  theme,
  children,
}: {
  theme: PageThemeConfig;
  children: ReactNode;
}) {
  // General is a complete no-op — identical DOM, nothing themed in the tree.
  if (theme.id === EventPageTheme.General || theme.dataTheme === null) {
    return <>{children}</>;
  }

  return (
    <div
      data-theme={theme.dataTheme}
      className={clsx("relative", theme.wrapperClassName)}
      style={theme.tokens as CSSProperties | undefined}
    >
      <EffectLayers layers={theme.background?.layers} />
      {/* Preserve OuterPage's vertical rhythm (space-y-8) that would otherwise
          be lost by this wrapper — keeps marquee/hero spacing identical to the
          general theme. */}
      <div className="space-y-8">{children}</div>
      <EffectLayers layers={theme.foregroundLayers} />
    </div>
  );
}
