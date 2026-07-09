/**
 * Translates a Prismic product-category Select value via the
 * `store.categoryNames.*` messages, falling back to the raw value for any
 * category that gains no translation (e.g. newly added options in Prismic).
 */
const KNOWN_CATEGORIES = [
  "Merch",
  "Music",
  "Albums",
  "Donations",
  "Tickets",
  "Licenses",
  "Currencies",
  "Other",
] as const;

type CategoryKey = (typeof KNOWN_CATEGORIES)[number];

export function translateCategory(
  t: (key: CategoryKey) => string,
  category: string | null | undefined
): string {
  if (!category) return "";
  return KNOWN_CATEGORIES.includes(category as CategoryKey)
    ? t(category as CategoryKey)
    : category;
}
