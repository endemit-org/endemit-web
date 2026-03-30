"use server";

import { prisma } from "@/lib/services/prisma";
import { checkOtcRateLimit } from "@/domain/auth/operations/checkOtcRateLimit";
import { recordOtcRequest } from "@/domain/auth/operations/recordOtcRequest";
import { generateOtcCode } from "@/domain/auth/operations/generateOtcCode";
import { generateMagicLink } from "@/domain/auth/operations/generateMagicLink";
import { createOtcToken } from "@/domain/auth/operations/createOtcToken";
import { queueOtcEmail } from "@/domain/auth/operations/queueOtcEmail";
import type { OtcRequestResult } from "@/domain/auth/types";

const OTC_EXPIRATION_MINUTES = 10;

interface RequestOtcCodeParams {
  email: string;
}

export const requestOtcCode = async ({
  email,
}: RequestOtcCodeParams): Promise<OtcRequestResult> => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check rate limit
  const rateLimit = await checkOtcRateLimit(normalizedEmail);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: "Too many requests. Please try again later.",
      rateLimitRemaining: 0,
    };
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Record the request for rate limiting even if user doesn't exist
    await recordOtcRequest(normalizedEmail);
    return {
      success: false,
      error: "NO_ACCOUNT",
      rateLimitRemaining: rateLimit.remaining - 1,
    };
  }

  // Check if user status allows OTC sign-in
  // Allow ACTIVE and PENDING_VERIFICATION users
  if (user.status !== "ACTIVE" && user.status !== "PENDING_VERIFICATION") {
    await recordOtcRequest(normalizedEmail);
    return {
      success: false,
      error: "Account is not active",
      rateLimitRemaining: rateLimit.remaining - 1,
    };
  }

  // Check if user has OTC sign-in type
  if (user.signInType !== "OTC") {
    await recordOtcRequest(normalizedEmail);
    return {
      success: false,
      error: "WRONG_AUTH_METHOD",
      rateLimitRemaining: rateLimit.remaining - 1,
    };
  }

  // Generate code and magic link
  const code = generateOtcCode();
  const magicLink = generateMagicLink();
  const expiresAt = new Date(Date.now() + OTC_EXPIRATION_MINUTES * 60 * 1000);

  // Create OTC token
  await createOtcToken({
    userId: user.id,
    code,
    magicLink,
    expiresAt,
  });

  // Record the request for rate limiting
  await recordOtcRequest(normalizedEmail);

  // Queue email
  await queueOtcEmail({
    email: normalizedEmail,
    code,
    magicLink,
    expiresInMinutes: OTC_EXPIRATION_MINUTES,
  });

  return {
    success: true,
    rateLimitRemaining: rateLimit.remaining - 1,
  };
};
