import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  isValidStickerCode,
  normalizeStickerCode,
} from "@/domain/sticker/util/validateStickerCode";

export interface AssignStickerResult {
  code: string;
  userId: string;
  claimedAt: Date;
  replacedCode: string | null;
}

export async function assignSticker(
  rawCode: string,
  userId: string
): Promise<AssignStickerResult> {
  const code = normalizeStickerCode(rawCode);

  if (!isValidStickerCode(code)) {
    throw new Error("Invalid sticker code format");
  }

  return await prisma.$transaction(async tx => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const sticker = await tx.stickerCode.findUnique({ where: { code } });
    if (!sticker) {
      throw new Error("Sticker code not found");
    }

    if (sticker.userId && sticker.userId !== userId) {
      throw new Error("Sticker is already linked to another account");
    }

    let replacedCode: string | null = null;
    const currentUserSticker = await tx.stickerCode.findUnique({
      where: { userId },
    });
    if (currentUserSticker && currentUserSticker.code !== code) {
      await tx.stickerCode.update({
        where: { code: currentUserSticker.code },
        data: { userId: null, claimedAt: null },
      });
      replacedCode = currentUserSticker.code;
    }

    const claimedAt = new Date();
    await tx.stickerCode.update({
      where: { code },
      data: { userId, claimedAt },
    });

    return { code, userId, claimedAt, replacedCode };
  });
}
