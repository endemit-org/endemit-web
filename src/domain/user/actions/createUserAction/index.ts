"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createUser } from "@/domain/user/operations/createUser";
import type { CreateUserInput, SerializedUser } from "@/domain/user/types";

export async function createUserAction(
  data: CreateUserInput
): Promise<SerializedUser> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_CREATE),
    "User not authorized to create users"
  );

  return await createUser(data);
}
