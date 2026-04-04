import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { OtcVerifyResult } from "@/domain/auth/types";

export const verifyMagicLink = async (
  magicLinkToken: string
): Promise<OtcVerifyResult> => {
  // Find the token by magic link
  const token = await prisma.otcToken.findUnique({
    where: { magicLink: magicLinkToken },
    include: { user: true },
  });

  if (!token) {
    return { success: false, error: "Invalid link" };
  }

  // Check if already used
  if (token.usedAt) {
    return { success: false, error: "This link has already been used" };
  }

  // Check if expired
  if (token.expiresAt < new Date()) {
    return { success: false, error: "This link has expired" };
  }

  // Check if user status allows verification
  // Allow ACTIVE and PENDING_VERIFICATION users
  const user = token.user;
  if (user.status !== "ACTIVE" && user.status !== "PENDING_VERIFICATION") {
    return { success: false, error: "Account is not active" };
  }

  // Mark the token as used
  await prisma.otcToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  });

  // Build update data
  const updateData: {
    lastLoginAt: Date;
    emailVerified?: Date;
    status?: "ACTIVE";
  } = {
    lastLoginAt: new Date(),
  };

  // If this is the first successful verification, set emailVerified and activate the account
  if (!user.emailVerified) {
    updateData.emailVerified = new Date();
    updateData.status = "ACTIVE";
  }

  // Update user
  await prisma.user.update({
    where: { id: token.userId },
    data: updateData,
  });

  return { success: true, userId: token.userId };
};
