export const STICKER_CODE_REGEX = /^[A-Z]{2}[0-9]{2}$/;

// Extract a sticker code from either a raw code ("AB12") or a sticker URL
// (e.g. "https://endemit.org/s/ab12" or "/s/ab12"). Anything after the
// "/s/" segment up to the next slash/query is the candidate; the caller
// still validates format via isValidStickerCode.
export function extractStickerCode(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/s\/([^/?#]+)/i);
  return match ? match[1] : trimmed;
}

export function normalizeStickerCode(raw: string): string {
  return extractStickerCode(raw).toUpperCase();
}

export function isValidStickerCode(code: string): boolean {
  return STICKER_CODE_REGEX.test(code);
}
