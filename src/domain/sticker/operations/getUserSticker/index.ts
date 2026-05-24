import "server-only";

import { prisma } from "@/lib/services/prisma";

export interface UserStickerInfo {
  code: string;
  claimedAt: Date | null;
}

export async function getUserSticker(
  userId: string
): Promise<UserStickerInfo | null> {
  const sticker = await prisma.stickerCode.findUnique({
    where: { userId },
    select: { code: true, claimedAt: true },
  });

  if (!sticker) return null;

  return { code: sticker.code, claimedAt: sticker.claimedAt };
}
