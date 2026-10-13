import "server-only";

import { createHash } from "crypto";

/**
 * Normalization and hashing primitives shared by every ad platform's
 * server-side event sender.
 *
 * Normalization is not cosmetic. Both Meta and TikTok match a server event to
 * a person by comparing SHA-256 hashes, so an unnormalized value hashes to
 * something neither platform can ever match — the API still answers 200 while
 * the match rate quietly sits near zero. The rules below are the intersection
 * of both platforms' specs; where they differ (phone formatting, array vs
 * scalar hashes) the platform module applies its own shape on top.
 */

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Lowercase, trim, collapse internal whitespace. */
export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Lowercased, whitespace-free email, or undefined when not plausible. */
export function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const normalized = normalizeText(email).replace(/\s/g, "");
  return normalized.includes("@") ? normalized : undefined;
}

/**
 * Phone digits including the country code, with no "+" and no trunk zero.
 *
 * Slovenian numbers arrive as "031 234 567", "+386 31 234 567" or
 * "00386 31 234 567"; all three must reduce to "38631234567". Platforms that
 * want E.164 prepend their own "+" (see `toE164`).
 */
export function normalizePhoneDigits(
  phone?: string | null,
  countryCode: string = "386"
): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = `${countryCode}${digits.slice(1)}`;
  } else if (!digits.startsWith(countryCode) && digits.length <= 9) {
    digits = `${countryCode}${digits}`;
  }

  return digits;
}

/** E.164 form ("+38631234567"), which TikTok expects before hashing. */
export function toE164(digits?: string): string | undefined {
  return digits ? `+${digits}` : undefined;
}

/** Letters and digits only, lowercased — used for names. */
export function normalizeName(name?: string | null): string | undefined {
  if (!name) return undefined;
  const normalized = normalizeText(name).replace(/[^\p{L}\p{N}]/gu, "");
  return normalized || undefined;
}

/** Letters only, lowercased — used for city names. */
export function normalizeCity(city?: string | null): string | undefined {
  if (!city) return undefined;
  const normalized = normalizeText(city).replace(/[^\p{L}]/gu, "");
  return normalized || undefined;
}

/** Lowercased, spaces removed, truncated at the first space-separated part. */
export function normalizePostalCode(
  postalCode?: string | null
): string | undefined {
  if (!postalCode) return undefined;
  const normalized = normalizeText(postalCode).split(" ")[0];
  return normalized || undefined;
}

/** Two-letter ISO 3166-1 alpha-2, lowercased. */
export function normalizeCountry(country?: string | null): string | undefined {
  if (!country) return undefined;
  const normalized = normalizeText(country).replace(/[^a-z]/g, "");
  return normalized.length === 2 ? normalized : undefined;
}

/**
 * Splits a single full-name field into first and last name. Both platforms
 * want them separate, our checkout collects one free-text "name" field, so
 * everything after the first token is treated as the last name.
 */
export function splitName(fullName?: string | null): {
  firstName?: string;
  lastName?: string;
} {
  if (!fullName) return {};
  const parts = normalizeText(fullName).split(" ").filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Raw (unhashed) identifiers for one person, as the order knows them.
 * Hashing happens inside each platform's sender, never at the call site.
 */
export interface TrackedUserData {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  /** Our own user id, sent as the platform's external id. */
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  /** Meta browser id (`_fbp` cookie). */
  fbp?: string | null;
  /** Meta click id (`_fbc` cookie, derived from `fbclid`). */
  fbc?: string | null;
  /** TikTok click id (`ttclid` query parameter). */
  ttclid?: string | null;
  /** TikTok browser id (`_ttp` cookie). */
  ttp?: string | null;
}
