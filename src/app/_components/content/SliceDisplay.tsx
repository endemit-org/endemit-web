import { SliceZone, SliceZoneLike } from "@prismicio/react";
import { components } from "@/app/_components/content/sliceComponents";
import type { AppLocale } from "@/i18n/routing";
import type { PageThemeConfig } from "@/domain/event/config/pageThemes";

export interface SliceContext {
  locale: AppLocale;
  /**
   * Active page theme (JSON-serializable). Slices read
   * `context.theme?.slices?.[slice.slice_type]` for their per-theme override.
   * Absent on non-themed pages — every existing call site stays unchanged.
   */
  theme?: PageThemeConfig;
}

interface Props {
  slices: SliceZoneLike;
  locale?: AppLocale;
  theme?: PageThemeConfig;
}

export default function SliceDisplay({ slices, locale = "sl", theme }: Props) {
  return (
    <SliceZone
      slices={slices}
      components={components}
      context={{ locale, theme } satisfies SliceContext}
    />
  );
}
