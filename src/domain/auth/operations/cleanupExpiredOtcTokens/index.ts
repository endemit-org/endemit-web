import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Cleanup expired OTC tokens and old rate limit records
 * This should be run periodically (e.g., via a cron job)
 */
export const cleanupExpiredOtcTokens = async (): Promise<{
  deletedTokens: number;
  deletedRateLimits: number;
}> => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Delete expired tokens
  const deletedTokens = await prisma.otcToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { usedAt: { not: null } }, // Already used tokens can be deleted
      ],
    },
  });

  // Delete old rate limit records (older than 1 hour)
  const deletedRateLimits = await prisma.otcRateLimit.deleteMany({
    where: {
      createdAt: { lt: oneHourAgo },
    },
  });

  return {
    deletedTokens: deletedTokens.count,
    deletedRateLimits: deletedRateLimits.count,
  };
};
