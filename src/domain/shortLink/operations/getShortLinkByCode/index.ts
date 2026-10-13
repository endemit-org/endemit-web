import "server-only";

import { prisma } from "@/lib/services/prisma";
import { normalizeShortCode } from "@/domain/shortLink/businessLogic";

/** Looks up a code for redirecting. Returns null when unknown or disabled. */
export const getShortLinkByCode = async (code: string) => {
  const link = await prisma.shortLink.findUnique({
    where: { code: normalizeShortCode(code) },
  });

  if (!link || !link.isActive) {
    return null;
  }

  return link;
};
