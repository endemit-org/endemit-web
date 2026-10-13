/**
 * Short link rules, shared by the admin UI and the server operations so the
 * form rejects what the server would reject.
 */

/**
 * Characters used for generated codes. Deliberately excludes 0/o/1/l/i, which
 * are the pairs people confuse when reading a code off a printed sticker or
 * reading one out loud.
 */
const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export const GENERATED_CODE_LENGTH = 6;

/** Codes live in a URL path segment, so keep them to url-safe characters. */
export const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,31}$/;

/**
 * Path segments that already mean something on this domain and must never be
 * shadowed by a short code.
 */
const RESERVED_CODES = new Set([
  "admin",
  "api",
  "go",
  "pos",
  "scan",
  "store",
  "profile",
  "signin",
  "s",
  "new",
  "edit",
]);

/** Random code. Not cryptographic — uniqueness is enforced by the database. */
export function generateShortCode(
  length: number = GENERATED_CODE_LENGTH
): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Codes are stored and matched lowercase, so print can be typed in any case. */
export function normalizeShortCode(code: string): string {
  return code.trim().toLowerCase();
}

export function validateShortCode(code: string): string | null {
  const normalized = normalizeShortCode(code);
  if (!normalized) return "Code is required";
  if (!CODE_PATTERN.test(normalized)) {
    return "Use 2-32 characters: lowercase letters, numbers and dashes, starting with a letter or number";
  }
  if (RESERVED_CODES.has(normalized)) {
    return "That code is reserved";
  }
  return null;
}

/**
 * Validates a redirect target.
 *
 * Admins may point a link anywhere, internal or external, but the scheme is
 * restricted to http and https. A `javascript:` or `data:` target would turn
 * a link on our own domain into a script-execution or content-injection
 * vector for anyone who scans the QR code, which no amount of admin trust
 * makes acceptable.
 */
export function validateTargetUrl(targetUrl: string): string | null {
  const trimmed = targetUrl.trim();
  if (!trimmed) return "Target URL is required";

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Enter a full URL including https://";
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Only http and https links are allowed";
  }

  return null;
}

/** The full public URL a code resolves to, for display, copying and QR codes. */
export function buildShortLinkUrl(baseUrl: string, code: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/go/${normalizeShortCode(code)}`;
}
