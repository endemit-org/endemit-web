"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { terminateSession } from "@/domain/user/operations/terminateSession";

export async function terminateSessionAction(
  sessionId: string
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_UPDATE),
    "User not authorized to manage user sessions"
  );

  await terminateSession(sessionId);

  return { success: true };
}
