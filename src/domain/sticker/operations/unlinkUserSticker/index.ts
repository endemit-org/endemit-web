import "server-only";

import { prisma } from "@/lib/services/prisma";
import { queueStickerUnlinkedEmail } from "@/domain/sticker/operations/queueStickerEmail";

export async function unlinkUserSticker(userId: string): Promise<string | null> {
  const sticker = await prisma.stickerCode.findUnique({
    where: { userId },
  });

  if (!sticker) {
    return null;
  }

  await prisma.stickerCode.update({
    where: { code: sticker.code },
    data: { userId: null, claimedAt: null },
  });

  queueStickerUnlinkedEmail({ userId, code: sticker.code }).catch(() => {});

  return sticker.code;
}
