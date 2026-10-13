import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import {
  generateShortCode,
  normalizeShortCode,
  validateShortCode,
  validateTargetUrl,
} from "@/domain/shortLink/businessLogic";
import type { ShortLinkInput } from "@/domain/shortLink/types";

/** How many random codes to try before giving up on a collision. */
const MAX_GENERATION_ATTEMPTS = 5;

/**
 * Creates a short link, generating a random code when none is given.
 *
 * Collisions are detected by the unique constraint rather than a pre-read:
 * checking first and inserting after leaves a race between two admins, while
 * catching P2002 is exact.
 */
export const createShortLink = async (
  input: ShortLinkInput,
  createdBy?: string
) => {
  const targetError = validateTargetUrl(input.targetUrl);
  if (targetError) {
    throw new Error(targetError);
  }

  const wantsGeneratedCode = !input.code?.trim();

  if (!wantsGeneratedCode) {
    const codeError = validateShortCode(input.code!);
    if (codeError) {
      throw new Error(codeError);
    }
  }

  const data = {
    targetUrl: input.targetUrl.trim(),
    description: input.description?.trim() || null,
    isActive: input.isActive ?? true,
    createdBy: createdBy ?? null,
  };

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const code = wantsGeneratedCode
      ? generateShortCode()
      : normalizeShortCode(input.code!);

    try {
      return await prisma.shortLink.create({ data: { ...data, code } });
    } catch (error) {
      const isCodeTaken =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isCodeTaken) throw error;

      // A chosen code that is taken is a user error; a generated one that
      // collides just needs another roll of the dice.
      if (!wantsGeneratedCode) {
        throw new Error("That code is already in use");
      }
    }
  }

  throw new Error("Could not generate an unused code, please try again");
};
