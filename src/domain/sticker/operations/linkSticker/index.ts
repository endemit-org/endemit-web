import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  isValidStickerCode,
  normalizeStickerCode,
} from "@/domain/sticker/util/validateStickerCode";
import { queueStickerLinkedEmail } from "@/domain/sticker/operations/queueStickerEmail";

export type LinkStickerResult =
  | { status: "linked"; code: string; claimedAt: Date }
  | { status: "already_yours"; code: string }
  | { status: "conflict_other"; code: string; otherUserId: string }
  | { status: "swap_required"; code: string; existingCode: string };

export async function linkSticker(
  rawCode: string,
  userId: string
): Promise<LinkStickerResult> {
  const code = normalizeStickerCode(rawCode);

  if (!isValidStickerCode(code)) {
    throw new Error("Invalid sticker code format");
  }

  const result = await prisma.$transaction<LinkStickerResult>(async tx => {
    const sticker = await tx.stickerCode.findUnique({ where: { code } });

    if (!sticker) {
      throw new Error("Sticker code not found");
    }

    if (sticker.userId === userId) {
      return { status: "already_yours", code };
    }

    if (sticker.userId) {
      return {
        status: "conflict_other",
        code,
        otherUserId: sticker.userId,
      };
    }

    const existingUserSticker = await tx.stickerCode.findUnique({
      where: { userId },
    });

    if (existingUserSticker) {
      return {
        status: "swap_required",
        code,
        existingCode: existingUserSticker.code,
      };
    }

    const claimedAt = new Date();
    await tx.stickerCode.update({
      where: { code },
      data: { userId, claimedAt },
    });

    return { status: "linked", code, claimedAt };
  });

  if (result.status === "linked") {
    queueStickerLinkedEmail({ userId, code: result.code }).catch(() => {});
  }

  return result;
}
