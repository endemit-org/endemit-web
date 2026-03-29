"use server";

import { prisma } from "@/lib/services/prisma";
import { checkOtcRateLimit } from "@/domain/auth/operations/checkOtcRateLimit";
import { recordOtcRequest } from "@/domain/auth/operations/recordOtcRequest";
import { generateOtcCode } from "@/domain/auth/operations/generateOtcCode";
import { generateMagicLink } from "@/domain/auth/operations/generateMagicLink";
import { createOtcToken } from "@/domain/auth/operations/createOtcToken";
import { queueOtcEmail } from "@/domain/auth/operations/queueOtcEmail";
import { assignRoleToUser } from "@/domain/auth/operations/assignRoleToUser";
import { ROLE_SLUGS } from "@/domain/auth/config/roles.config";
import type { OtcRequestResult } from "@/domain/auth/types";

const OTC_EXPIRATION_MINUTES = 10;

interface RegisterOtcUserParams {
  email: string;
}

export const registerOtcUser = async ({
  email,
}: RegisterOtcUserParams): Promise<OtcRequestResult> => {
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

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    await recordOtcRequest(normalizedEmail);
    return {
      success: false,
      error: "An account with this email already exists.",
      rateLimitRemaining: rateLimit.remaining - 1,
    };
  }

  // Create new user with OTC sign-in type
  // Use email as username, start with PENDING_VERIFICATION status
  const user = await prisma.user.create({
    data: {
      username: normalizedEmail,
      email: normalizedEmail,
      signInType: "OTC",
      status: "PENDING_VERIFICATION",
    },
  });

  // Assign the default "user" role
  await assignRoleToUser(user.id, ROLE_SLUGS.USER);

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
