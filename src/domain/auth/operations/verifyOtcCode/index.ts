import "server-only";

import { prisma } from "@/lib/services/prisma";
import { getLocale } from "next-intl/server";
import type { OtcVerifyResult } from "@/domain/auth/types";
import { MAX_OTC_ATTEMPTS } from "@/domain/auth/config/otc.config";
import {
  RATE_LIMITED_MESSAGE,
  consumeClientRateLimit,
} from "@/lib/services/rateLimit";

interface VerifyOtcCodeParams {
  email: string;
  code: string;
}

const TOO_MANY_ATTEMPTS_ERROR =
  "Too many incorrect attempts. Request a new code.";

export const verifyOtcCode = async ({
  email,
  code,
}: VerifyOtcCodeParams): Promise<OtcVerifyResult> => {
  // Per-client cap on top of the per-token cap: stops one client from
  // spraying guesses across many accounts.
  const isAllowed = await consumeClientRateLimit("otc-verify", {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });
  if (!isAllowed) {
    return { success: false, error: RATE_LIMITED_MESSAGE };
  }

  // Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "Invalid code" };
  }

  // Check if user status allows verification
  // Allow ACTIVE and PENDING_VERIFICATION users
  if (user.status !== "ACTIVE" && user.status !== "PENDING_VERIFICATION") {
    return { success: false, error: "Account is not active" };
  }

  const now = new Date();
  const activeTokens = {
    userId: user.id,
    usedAt: null,
    expiresAt: { gt: now },
  };

  // Spend one attempt on every live token *before* comparing the code. The
  // conditional increment is atomic, so parallel guesses can't get more than
  // MAX_OTC_ATTEMPTS tries per token between them.
  const { count: tokensWithAttemptsLeft } = await prisma.otcToken.updateMany({
    where: { ...activeTokens, attempts: { lt: MAX_OTC_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });

  if (tokensWithAttemptsLeft === 0) {
    const hasLockedToken =
      (await prisma.otcToken.count({ where: activeTokens })) > 0;

    // Locked tokens stay in place (their magic link still works); the next
    // code request issues a fresh code instead of re-sending a locked one.
    return {
      success: false,
      error: hasLockedToken
        ? TOO_MANY_ATTEMPTS_ERROR
        : "Invalid or expired code",
    };
  }

  const token = await prisma.otcToken.findFirst({
    where: {
      ...activeTokens,
      code: code.toUpperCase(),
      attempts: { lte: MAX_OTC_ATTEMPTS },
    },
  });

  if (!token) {
    return { success: false, error: "Invalid or expired code" };
  }

  // Mark the token as used
  await prisma.otcToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  // Build update data (also record the locale the user signed in with)
  const locale = await getLocale();
  const updateData: {
    lastLoginAt: Date;
    emailVerified?: Date;
    status?: "ACTIVE";
    locale?: string;
  } = {
    lastLoginAt: new Date(),
    locale: locale === "en" ? "en" : "sl",
  };

  // If this is the first successful verification, set emailVerified and activate the account
  if (!user.emailVerified) {
    updateData.emailVerified = new Date();
    updateData.status = "ACTIVE";
  }

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return { success: true, userId: user.id };
};
