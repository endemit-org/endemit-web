import "server-only";

import { prisma } from "@/lib/services/prisma";
import { StickerCodeProperty } from "@prisma/client";

export function isStickerCodeProperty(
  value: unknown
): value is StickerCodeProperty {
  return (
    typeof value === "string" &&
    Object.values(StickerCodeProperty).includes(value as StickerCodeProperty)
  );
}

export async function updateStickerProperty(
  code: string,
  property: StickerCodeProperty | null
): Promise<void> {
  const sticker = await prisma.stickerCode.findUnique({ where: { code } });
  if (!sticker) {
    throw new Error("Sticker code not found");
  }

  await prisma.stickerCode.update({
    where: { code },
    data: { property },
  });
}
