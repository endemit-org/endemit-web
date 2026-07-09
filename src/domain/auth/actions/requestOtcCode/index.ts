"use server";

import { prisma } from "@/lib/services/prisma";
import { checkOtcRateLimit } from "@/domain/auth/operations/checkOtcRateLimit";
import { recordOtcRequest } from "@/domain/auth/operations/recordOtcRequest";
import { generateOtcCode } from "@/domain/auth/operations/generateOtcCode";
import { generateMagicLink } from "@/domain/auth/operations/generateMagicLink";
import { createOtcToken } from "@/domain/auth/operations/createOtcToken";
import { queueOtcEmail } from "@/domain/auth/operations/queueOtcEmail";
import type { OtcRequestResult } from "@/domain/auth/types";
import { getLocale } from "next-intl/server";

const OTC_EXPIRATION_MINUTES = 10;

interface RequestOtcCodeParams {
  email: string;
  callbackUrl?: string;
}

export const requestOtcCode = async ({
  email,
  callbackUrl,
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

  // Re-use a fresh, still-valid token instead of minting a new one: minting
  // invalidates every previous code, so a quick retry racing a slow email
  // delivery makes each emailed code dead on arrival. Re-sending the same
  // code keeps all recent emails valid at once.
  const existingToken = await prisma.otcToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      // Only re-use while it has a comfortable amount of life left.
      expiresAt: { gt: new Date(Date.now() + 5 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  let code: string;
  let magicLink: string;
  let expiresInMinutes = OTC_EXPIRATION_MINUTES;

  if (existingToken) {
    code = existingToken.code;
    magicLink = existingToken.magicLink;
    expiresInMinutes = Math.max(
      1,
      Math.round((existingToken.expiresAt.getTime() - Date.now()) / 60_000)
    );
  } else {
    code = generateOtcCode();
    magicLink = generateMagicLink();
    const expiresAt = new Date(
      Date.now() + OTC_EXPIRATION_MINUTES * 60 * 1000
    );
    await createOtcToken({
      userId: user.id,
      code,
      magicLink,
      expiresAt,
    });
  }

  // Record the request for rate limiting
  await recordOtcRequest(normalizedEmail);

  // Queue email in the visitor's current locale
  const locale = await getLocale();
  await queueOtcEmail({
    email: normalizedEmail,
    code,
    magicLink,
    expiresInMinutes,
    callbackUrl,
    locale,
  });

  return {
    success: true,
    rateLimitRemaining: rateLimit.remaining - 1,
  };
};
