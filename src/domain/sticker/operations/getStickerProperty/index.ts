import "server-only";

import type { StickerCodeProperty } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import {
  isValidStickerCode,
  normalizeStickerCode,
} from "@/domain/sticker/util/validateStickerCode";

/**
 * Wristband color for a raw scanned code — null when the code is malformed
 * or unknown, so callers can fall back to the color-cycling band.
 */
export async function getStickerProperty(
  rawCode: string
): Promise<StickerCodeProperty | null> {
  const code = normalizeStickerCode(rawCode);
  if (!isValidStickerCode(code)) return null;

  const sticker = await prisma.stickerCode.findUnique({
    where: { code },
    select: { property: true },
  });
  return sticker?.property ?? null;
}
