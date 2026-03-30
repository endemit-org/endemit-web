"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updateUserPassword } from "@/domain/user/operations/updateUserPassword";

export async function updateUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_UPDATE),
    "User not authorized to update users"
  );

  assert(newPassword.length >= 8, "Password must be at least 8 characters");

  await updateUserPassword(userId, newPassword);

  return { success: true };
}
