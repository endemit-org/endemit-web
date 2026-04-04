"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { assignRoleToUser } from "@/domain/auth/operations/assignRoleToUser";

export async function assignRoleAction(
  userId: string,
  roleSlug: string
): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_MANAGE_ROLES),
    "User not authorized to manage user roles"
  );

  await assignRoleToUser(userId, roleSlug, user.id);

  return { success: true };
}
