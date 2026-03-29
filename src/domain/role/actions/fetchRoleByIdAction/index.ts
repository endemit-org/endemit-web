"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getRoleById } from "@/domain/role/operations/getRoleById";
import type { SerializedRole } from "@/domain/role/types";

export async function fetchRoleById(id: string): Promise<SerializedRole | null> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ROLES_READ),
    "User not authorized to read roles"
  );

  return await getRoleById(id);
}
