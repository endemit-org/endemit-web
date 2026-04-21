export const STICKER_CODE_REGEX = /^[A-Z]{2}[0-9]{2}$/;

export function normalizeStickerCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isValidStickerCode(code: string): boolean {
  return STICKER_CODE_REGEX.test(code);
}
