"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updateUser } from "@/domain/user/operations/updateUser";
import type { UpdateUserInput, SerializedUser } from "@/domain/user/types";

export async function updateUserAction(
  userId: string,
  data: UpdateUserInput
): Promise<SerializedUser> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_UPDATE),
    "User not authorized to update users"
  );

  return await updateUser(userId, data);
}
