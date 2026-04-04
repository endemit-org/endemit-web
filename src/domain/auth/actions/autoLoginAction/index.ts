"use server";

import { getCurrentUser, createUserSession } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";

const AUTO_LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function autoLoginAction(userId: string): Promise<boolean> {
  const currentUser = await getCurrentUser();

  // Already logged in
  if (currentUser) {
    return false;
  }

  // Check if user was recently created (during checkout)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });

  if (!user) {
    return false;
  }

  // Only auto-login if account was created within the last 5 minutes
  const accountAge = Date.now() - user.createdAt.getTime();
  if (accountAge > AUTO_LOGIN_WINDOW_MS) {
    return false;
  }

  await createUserSession(userId);
  return true;
}
