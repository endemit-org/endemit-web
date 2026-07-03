import { isFilled, type RichTextField } from "@prismicio/client";
import type { AppLocale } from "@/i18n/routing";

function isFilledValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return isFilled.richText(value as RichTextField);
  return true;
}

/**
 * Reads a Prismic field for the given locale using the "duplicated fields"
 * strategy: base fields hold English content, `<field>_sl` twins hold
 * Slovenian.
 *
 * - locale "sl": returns `<field>_sl` when it has content, otherwise falls back
 *   to the base (English) field so the page never renders blank while
 *   translation is in progress.
 * - locale "en": always returns the base field.
 *
 * Works for KeyText (string), RichText (array) and other field kinds.
 */
export function pickLocalized<D extends Record<string, unknown>, K extends string & keyof D>(
  data: D,
  field: K,
  locale: AppLocale
): D[K] {
  if (locale === "sl") {
    const slValue = (data as Record<string, unknown>)[`${field}_sl`];
    if (isFilledValue(slValue)) {
      return slValue as D[K];
    }
  }
  return data[field];
}
