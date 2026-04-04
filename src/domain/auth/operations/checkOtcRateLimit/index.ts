import "server-only";

import { prisma } from "@/lib/services/prisma";

const OTC_RATE_LIMIT = 10; // 10 requests per hour
const OTC_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour in milliseconds

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export const checkOtcRateLimit = async (
  email: string
): Promise<RateLimitResult> => {
  const windowStart = new Date(Date.now() - OTC_RATE_LIMIT_WINDOW_MS);

  const requestCount = await prisma.otcRateLimit.count({
    where: {
      email: email.toLowerCase(),
      createdAt: {
        gte: windowStart,
      },
    },
  });

  const remaining = Math.max(0, OTC_RATE_LIMIT - requestCount);
  const resetAt = new Date(Date.now() + OTC_RATE_LIMIT_WINDOW_MS);

  return {
    allowed: requestCount < OTC_RATE_LIMIT,
    remaining,
    resetAt,
  };
};
