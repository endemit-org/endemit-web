import "server-only";

import { prisma } from "@/lib/services/prisma";
import { getLocale } from "next-intl/server";
import type { OtcVerifyResult } from "@/domain/auth/types";

interface VerifyOtcCodeParams {
  email: string;
  code: string;
}

export const verifyOtcCode = async ({
  email,
  code,
}: VerifyOtcCodeParams): Promise<OtcVerifyResult> => {
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

  // Find a valid, unused token for this user with matching code
  const token = await prisma.otcToken.findFirst({
    where: {
      userId: user.id,
      code: code.toUpperCase(),
      usedAt: null,
      expiresAt: {
        gt: new Date(),
      },
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
