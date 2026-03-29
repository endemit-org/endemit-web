"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getUserById } from "@/domain/user/operations/getUserById";
import type { SerializedUserWithSessions } from "@/domain/user/types";

export async function fetchUserById(
  userId: string
): Promise<SerializedUserWithSessions | null> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_READ),
    "User not authorized to read users"
  );

  return await getUserById(userId);
}
