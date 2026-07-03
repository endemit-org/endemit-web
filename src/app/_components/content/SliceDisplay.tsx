import { SliceZone, SliceZoneLike } from "@prismicio/react";
import { components } from "@/app/_components/content/sliceComponents";
import type { AppLocale } from "@/i18n/routing";

export interface SliceContext {
  locale: AppLocale;
}

interface Props {
  slices: SliceZoneLike;
  locale?: AppLocale;
}

export default function SliceDisplay({ slices, locale = "sl" }: Props) {
  return (
    <SliceZone
      slices={slices}
      components={components}
      context={{ locale } satisfies SliceContext}
    />
  );
}
