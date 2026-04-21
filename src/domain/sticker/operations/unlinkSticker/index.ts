import "server-only";

import { prisma } from "@/lib/services/prisma";

export async function unlinkSticker(userId: string): Promise<void> {
  const sticker = await prisma.stickerCode.findUnique({
    where: { userId },
  });

  if (!sticker) {
    return;
  }

  await prisma.stickerCode.update({
    where: { code: sticker.code },
    data: { userId: null, claimedAt: null },
  });
}
