import "server-only";

import { createHash } from "crypto";

/**
 * Advanced Matching normalization + hashing for Conversions API user data.
 *
 * Meta matches a server event to a person by comparing SHA-256 hashes of
 * normalized identifiers. Normalization is not cosmetic: an unnormalized
 * value hashes to something Meta never matches, silently dropping the match
 * rate to near zero while the API still answers 200. Rules follow Meta's
 * customer information parameters spec.
 */

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Lowercase, trim, collapse internal whitespace. */
function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function hashEmail(email?: string | null): string | undefined {
  if (!email) return undefined;
  const normalized = normalizeText(email).replace(/\s/g, "");
  if (!normalized.includes("@")) return undefined;
  return sha256(normalized);
}

/**
 * Phone numbers hash as digits only, including the country code and without a
 * leading "+" or trunk zero. Slovenian numbers arrive as "031 234 567" or
 * "+386 31 234 567"; both must end up as "38631234567".
 */
export function hashPhone(
  phone?: string | null,
  countryCode: string = "386"
): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;

  if (digits.startsWith("00")) {
    // "00386…" international prefix
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    // National trunk prefix: drop it, prepend the country code.
    digits = `${countryCode}${digits.slice(1)}`;
  } else if (!digits.startsWith(countryCode) && digits.length <= 9) {
    // Bare subscriber number with no prefix at all.
    digits = `${countryCode}${digits}`;
  }

  return sha256(digits);
}

export function hashName(name?: string | null): string | undefined {
  if (!name) return undefined;
  const normalized = normalizeText(name).replace(/[^\p{L}\p{N}]/gu, "");
  if (!normalized) return undefined;
  return sha256(normalized);
}

export function hashCity(city?: string | null): string | undefined {
  if (!city) return undefined;
  const normalized = normalizeText(city).replace(/[^\p{L}]/gu, "");
  if (!normalized) return undefined;
  return sha256(normalized);
}

/**
 * Postal codes hash lowercased with spaces removed. Only the part before the
 * first space is used, per Meta's spec.
 */
export function hashPostalCode(postalCode?: string | null): string | undefined {
  if (!postalCode) return undefined;
  const normalized = normalizeText(postalCode).split(" ")[0];
  if (!normalized) return undefined;
  return sha256(normalized);
}

/** Two-letter ISO 3166-1 alpha-2, lowercased. */
export function hashCountry(country?: string | null): string | undefined {
  if (!country) return undefined;
  const normalized = normalizeText(country).replace(/[^a-z]/g, "");
  if (normalized.length !== 2) return undefined;
  return sha256(normalized);
}

/** External id (our own user id) is hashed like any other identifier. */
export function hashExternalId(id?: string | null): string | undefined {
  if (!id) return undefined;
  return sha256(id.trim().toLowerCase());
}

/**
 * Splits a single full-name field into first/last. Meta wants them separate,
 * our checkout collects one "name" field. Everything after the first token
 * becomes the last name — the best available reading of a free-text field.
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
