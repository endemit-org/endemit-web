"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createRole } from "@/domain/role/operations/createRole";
import type { CreateRoleInput, SerializedRole } from "@/domain/role/types";

export async function createRoleAction(input: CreateRoleInput): Promise<SerializedRole> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ROLES_CREATE),
    "User not authorized to create roles"
  );

  return await createRole(input);
}
