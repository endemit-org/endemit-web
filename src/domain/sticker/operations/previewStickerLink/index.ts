import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  isValidStickerCode,
  normalizeStickerCode,
} from "@/domain/sticker/util/validateStickerCode";
import type { LinkStickerResult } from "@/domain/sticker/operations/linkSticker";

// Read-only counterpart of linkSticker. Returns the same discriminator
// without mutating, so the UI can decide whether to require a confirm
// tap (only the would-be-linked path needs explicit user consent).
export type PreviewStickerLinkResult =
  | { status: "would_link"; code: string }
  | { status: "already_yours"; code: string }
  | { status: "conflict_other"; code: string; otherUserId: string }
  | { status: "swap_required"; code: string; existingCode: string };

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

  if (sticker.userId === userId) {
    return { status: "already_yours", code };
  }

  if (sticker.userId) {
    return { status: "conflict_other", code, otherUserId: sticker.userId };
  }

  const existingUserSticker = await prisma.stickerCode.findUnique({
    where: { userId },
  });

  if (existingUserSticker) {
    return {
      status: "swap_required",
      code,
      existingCode: existingUserSticker.code,
    };
  }

  return { status: "would_link", code };
}

// Re-exported for caller convenience.
export type { LinkStickerResult };
