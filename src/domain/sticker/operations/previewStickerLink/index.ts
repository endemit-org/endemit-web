import "server-only";

import type { StickerCodeProperty } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import {
  isValidStickerCode,
  normalizeStickerCode,
} from "@/domain/sticker/util/validateStickerCode";
import type { LinkStickerResult } from "@/domain/sticker/operations/linkSticker";

// Read-only counterpart of linkSticker. Returns the same discriminator
// without mutating, so the UI can decide whether to require a confirm
// tap (only the would-be-linked path needs explicit user consent).
export type PreviewStickerLinkResult = {
  /** Wristband color of the scanned sticker, for the 3D band. */
  property: StickerCodeProperty | null;
} & (
  | { status: "would_link"; code: string }
  | { status: "already_yours"; code: string }
  | { status: "conflict_other"; code: string; otherUserId: string }
  | { status: "swap_required"; code: string; existingCode: string }
);

export async function previewStickerLink(
  rawCode: string,
  userId: string
): Promise<PreviewStickerLinkResult> {
  const code = normalizeStickerCode(rawCode);

  if (!isValidStickerCode(code)) {
    throw new Error("Invalid sticker code format");
  }

  const sticker = await prisma.stickerCode.findUnique({ where: { code } });

  if (!sticker) {
    throw new Error("Sticker code not found");
  }

  const property = sticker.property;

  if (sticker.userId === userId) {
    return { status: "already_yours", code, property };
  }

  if (sticker.userId) {
    return {
      status: "conflict_other",
      code,
      otherUserId: sticker.userId,
      property,
    };
  }

  const existingUserSticker = await prisma.stickerCode.findUnique({
    where: { userId },
  });

  if (existingUserSticker) {
    return {
      status: "swap_required",
      code,
      existingCode: existingUserSticker.code,
      property,
    };
  }

  return { status: "would_link", code, property };
}

// Re-exported for caller convenience.
export type { LinkStickerResult };
