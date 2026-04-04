"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllUsers } from "@/domain/user/operations/getAllUsers";
import type { PaginatedUsers } from "@/domain/user/types";

export async function fetchUsers(page?: number): Promise<PaginatedUsers> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.USERS_READ),
    "User not authorized to read users"
  );

  return await getAllUsers({ page });
}
