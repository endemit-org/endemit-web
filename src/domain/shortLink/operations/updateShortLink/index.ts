import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import {
  normalizeShortCode,
  validateShortCode,
  validateTargetUrl,
} from "@/domain/shortLink/businessLogic";

interface UpdateShortLinkInput {
  code?: string;
  targetUrl?: string;
  description?: string | null;
  isActive?: boolean;
}

/**
 * Updates a short link. Every field is optional, so the admin UI can use this
 * both for an edit form and for the enable/disable toggle.
 *
 * Re-aiming an existing code at a new target is the point: a QR code already
 * printed on a poster cannot be changed, so the link behind it must be.
 */
export const updateShortLink = async (
  id: string,
  input: UpdateShortLinkInput
) => {
  const data: Prisma.ShortLinkUpdateInput = {};

  if (input.targetUrl !== undefined) {
    const targetError = validateTargetUrl(input.targetUrl);
    if (targetError) throw new Error(targetError);
    data.targetUrl = input.targetUrl.trim();
  }

  if (input.code !== undefined) {
    const codeError = validateShortCode(input.code);
    if (codeError) throw new Error(codeError);
    data.code = normalizeShortCode(input.code);
  }

  if (input.description !== undefined) {
    data.description = input.description?.trim() || null;
  }

  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
  }

  if (Object.keys(data).length === 0) {
    throw new Error("Nothing to update");
  }

  try {
    return await prisma.shortLink.update({ where: { id }, data });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("That code is already in use");
    }
    throw error;
  }
};
