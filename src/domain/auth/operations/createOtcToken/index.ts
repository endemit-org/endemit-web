import "server-only";

import type { CreateOtcTokenData } from "@/domain/auth/types";
import { prisma } from "@/lib/services/prisma";

export const createOtcToken = async (data: CreateOtcTokenData) => {
  // Invalidate any existing unused tokens for this user
  await prisma.otcToken.updateMany({
    where: {
      userId: data.userId,
      usedAt: null,
    },
    data: {
      usedAt: new Date(), // Mark as used so they can't be used anymore
    },
  });

  // Create the new token
  const token = await prisma.otcToken.create({
    data: {
      userId: data.userId,
      code: data.code,
      magicLink: data.magicLink,
      expiresAt: data.expiresAt,
    },
  });

  return token;
};
