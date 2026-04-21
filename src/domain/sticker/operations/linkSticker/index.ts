import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  isValidStickerCode,
  normalizeStickerCode,
} from "@/domain/sticker/util/validateStickerCode";

export interface LinkStickerResult {
  code: string;
  claimedAt: Date;
}

export async function linkSticker(
  rawCode: string,
  userId: string
): Promise<LinkStickerResult> {
  const code = normalizeStickerCode(rawCode);

  if (!isValidStickerCode(code)) {
    throw new Error("Invalid sticker code format");
  }

  return await prisma.$transaction(async tx => {
    const existingUserSticker = await tx.stickerCode.findUnique({
      where: { userId },
    });

    if (existingUserSticker) {
      throw new Error(
        "You already have a sticker linked. Unlink it first to link a different one."
      );
    }

    const sticker = await tx.stickerCode.findUnique({ where: { code } });

    if (!sticker) {
      throw new Error("Sticker code not found");
    }

    if (sticker.userId) {
      throw new Error("Sticker is already linked to another account");
    }

    const claimedAt = new Date();
    await tx.stickerCode.update({
      where: { code },
      data: { userId, claimedAt },
    });

    return { code, claimedAt };
  });
}
