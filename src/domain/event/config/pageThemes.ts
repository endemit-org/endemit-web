import { EventPageTheme } from "@/domain/event/types/event";

/**
 * Per-event page theme system.
 *
 * A theme is a DECLARATIVE, JSON-serializable config (no functions/components —
 * heavy or client-only pieces are referenced by string id and resolved in
 * client-safe registries) so the whole thing can cross the RSC → client
 * boundary via SliceContext. It drives backgrounds, foreground effect layers,
 * layout switches, design tokens and per-slice overrides. `General` is the
 * default look and a complete no-op.
 *
 * Adding a theme = new EventPageTheme member + one entry here (+ its CSS scope,
 * and any new effect/scene ids in the client registries). No event-page or
 * slice code changes are required for a purely CSS/token theme.
 */

/** WebGL scene ids — resolved (lazily, isolated) in ThemeWebGLBackground. */
export type WebGLSceneId = "crt";

/** A single background/foreground layer of a theme. */
export type EffectLayer =
  | { kind: "webgl"; scene: WebGLSceneId; z?: number }
  | { kind: "overlay"; className: string; z?: number }
  | { kind: "component"; id: string; z?: number };

/** How a theme re-shapes an individual slice type. */
export interface ThemeSliceOverride {
  /** Structural variant the slice interprets itself (unknown → ignored). */
  variant?: string;
  /** Extra classes applied to the slice wrapper. */
  className?: string;
}

export interface PageThemeConfig {
  id: EventPageTheme;
  /** value for the `data-theme` attribute; null = general (no attribute). */
  dataTheme: string | null;
  /** extra classes on the themed page wrapper. */
  wrapperClassName?: string;
  /** CSS custom properties applied as inline style on the wrapper. */
  tokens?: Record<`--${string}`, string>;
  /** page background composition. */
  background?: {
    /** keep the default blurred cover-image backdrops (default: true). */
    showBlurredCover?: boolean;
    /** keep the default worms.png pattern overlay (default: true). */
    showWormsPattern?: boolean;
    /** extra layers rendered BEHIND the page content. */
    layers?: EffectLayer[];
  };
  /** layers rendered ABOVE the page content (scanlines, vignette…). */
  foregroundLayers?: EffectLayer[];
  /** layout/position switches interpreted by the event page. */
  layout?: {
    heroStyle?: "default" | "fullbleed";
    hideMarquee?: boolean;
    stickyColumn?: "right" | "none";
  };
  /** per-slice overrides keyed by Prismic slice_type. */
  slices?: Record<string, ThemeSliceOverride>;
  /** text-effect component id for headings (e.g. "glitch"), or null. */
  headingEffect?: string | null;
}

const GENERAL: PageThemeConfig = {
  id: EventPageTheme.General,
  dataTheme: null,
  headingEffect: null,
};

const CRT_GLITCH: PageThemeConfig = {
  id: EventPageTheme.CrtGlitch,
  dataTheme: "crt",
  tokens: {
    // Core theme colour.
    "--theme-accent": "#d9e020",
    "--theme-glow": "rgba(217, 224, 32, 0.45)",
    "--theme-scanline-opacity": "0.16",
    // ── Optional per-component colour overrides ──────────────────────────
    // Each is consumed by a scoped `[data-theme="crt"]` rule in crt.css via
    // `var(--name, <original default>)`, so removing any line here falls back
    // to the component's original colour. Nothing outside a themed page is
    // affected.
    "--theme-btn-bg": "#d9e020", // button background
    "--theme-btn-fg": "#231f20", // button foreground/text
    "--theme-tab-active": "#d9e020", // selected tab underline
    "--theme-tab-active-text": "#f3f4dc", // selected tab label
    "--theme-tab-inactive-text": "rgba(217, 224, 32, 0.5)", // deselected tab label
    "--theme-link": "#d9e020", // links (artist cards, location, etc.)
    "--theme-play-bg": "#d9e020", // play icon circle
    "--theme-play-fg": "#231f20", // play icon glyph
    "--theme-day-divider-bg": "rgba(217, 224, 32, 0.16)", // slider day dividers
    "--theme-day-divider-text": "#d9e020",
  },
  background: {
    // No blurred cover backdrops for CRT — the WebGL glitch is the full-page
    // background instead (fixed inset-0, behind all content).
    showBlurredCover: false,
    showWormsPattern: false,
    layers: [{ kind: "webgl", scene: "crt", z: 0 }],
  },
  foregroundLayers: [
    { kind: "overlay", className: "crt-scanlines", z: 40 },
    { kind: "overlay", className: "crt-noise-overlay", z: 41 },
    { kind: "overlay", className: "crt-vignette", z: 42 },
  ],
  layout: {},
  // Deliberately NO per-slice overrides: the theme touches only the page header,
  // the event title and the background — never individual slices (keeps the
  // glitch off content bodies and embedded videos, and off the render-cost of
  // dozens of slice headings).
  headingEffect: "glitch",
};

export const PAGE_THEMES: Record<EventPageTheme, PageThemeConfig> = {
  [EventPageTheme.General]: GENERAL,
  [EventPageTheme.CrtGlitch]: CRT_GLITCH,
};

/** Maps the Prismic Select label to the theme enum (defensive, general fallback). */
const CMS_THEME_LABELS: Record<string, EventPageTheme> = {
  General: EventPageTheme.General,
  "RAVE-ON": EventPageTheme.CrtGlitch,
  // Back-compat: accept the previous label too, in case an event was tagged
  // before the rename.
  "CRT Glitch": EventPageTheme.CrtGlitch,
};

export function mapPageTheme(
  label: string | null | undefined
): EventPageTheme {
  return (label && CMS_THEME_LABELS[label]) || EventPageTheme.General;
}

export function getPageTheme(id: EventPageTheme): PageThemeConfig {
  return PAGE_THEMES[id] ?? GENERAL;
}
