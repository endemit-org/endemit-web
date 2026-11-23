import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/services/prisma";

interface RateLimitRule {
  /** Maximum number of hits allowed inside the window. */
  limit: number;
  windowMs: number;
}

/**
 * Sliding-window rate limit backed by the database (no Redis in this stack).
 * Meant for low-volume, abuse-prone endpoints: sign-in, code verification,
 * promo codes. Every allowed call records one hit.
 */
export const consumeRateLimit = async (
  key: string,
  { limit, windowMs }: RateLimitRule
): Promise<boolean> => {
  const windowStart = new Date(Date.now() - windowMs);

  // Expired hits for this key are dropped as we go, so the table stays small
  // without a scheduled job.
  await prisma.rateLimitHit.deleteMany({
    where: { key, createdAt: { lt: windowStart } },
  });

  const hits = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  if (hits >= limit) return false;

  await prisma.rateLimitHit.create({ data: { key } });

  return true;
};

/**
 * Client IP of the current request, or null outside a request scope
 * (background jobs, scripts). Vercel sets these headers itself, so a client
 * can't spoof them.
 */
export const getClientIp = async (): Promise<string | null> => {
  try {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for");

    return (
      requestHeaders.get("x-real-ip")?.trim() ||
      forwardedFor?.split(",")[0]?.trim() ||
      null
    );
  } catch {
    return null;
  }
};

/**
 * Per-client limit for the current request. Calls without a request scope are
 * always allowed: they are our own server-side code, not a visitor.
 */
export const consumeClientRateLimit = async (
  name: string,
  rule: RateLimitRule
): Promise<boolean> => {
  const ip = await getClientIp();
  if (!ip) return true;

  return consumeRateLimit(`${name}:ip:${ip}`, rule);
};

export const RATE_LIMITED_MESSAGE = "Too many requests. Please try again later.";
