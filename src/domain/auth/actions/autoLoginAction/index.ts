"use server";

import { getCurrentUser, createUserSession } from "@/lib/services/auth";

export async function autoLoginAction(userId: string): Promise<boolean> {
  const currentUser = await getCurrentUser();

  // Only auto-login if user is not already logged in
  if (!currentUser) {
    await createUserSession(userId);
    return true;
  }

  return false;
}
