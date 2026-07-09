import "server-only";

import type { StickerCodeProperty } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";

export interface UserStickerInfo {
  code: string;
  claimedAt: Date | null;
  property: StickerCodeProperty | null;
}

export async function getUserSticker(
  userId: string
): Promise<UserStickerInfo | null> {
  const sticker = await prisma.stickerCode.findUnique({
    where: { userId },
    select: { code: true, claimedAt: true, property: true },
  });

  if (!sticker) return null;

  return {
    code: sticker.code,
    claimedAt: sticker.claimedAt,
    property: sticker.property,
  };
}
