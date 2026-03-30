"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { terminateAllUserSessions } from "@/domain/user/operations/terminateAllUserSessions";

export async function terminateAllSessionsAction(
  userId: string
): Promise<{ success: boolean; count: number }> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_UPDATE),
    "User not authorized to manage user sessions"
  );

  const count = await terminateAllUserSessions(userId);

  return { success: true, count };
}
