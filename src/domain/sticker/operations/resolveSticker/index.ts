import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  isValidStickerCode,
  normalizeStickerCode,
} from "@/domain/sticker/util/validateStickerCode";

export interface ResolveStickerResult {
  code: string;
  userId: string;
}

export async function resolveSticker(
  rawCode: string
): Promise<ResolveStickerResult> {
  const code = normalizeStickerCode(rawCode);

  if (!isValidStickerCode(code)) {
    throw new Error("Invalid sticker code format");
  }

  const sticker = await prisma.stickerCode.findUnique({
    where: { code },
    select: { code: true, userId: true },
  });

  if (!sticker) {
    throw new Error("Sticker code not found");
  }

  if (!sticker.userId) {
    throw new Error("Sticker is not linked to a user yet");
  }

  return { code: sticker.code, userId: sticker.userId };
}
