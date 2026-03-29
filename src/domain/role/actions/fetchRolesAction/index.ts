"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllRoles } from "@/domain/role/operations/getAllRoles";
import type { SerializedRole } from "@/domain/role/types";

export async function fetchRoles(): Promise<SerializedRole[]> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ROLES_READ),
    "User not authorized to read roles"
  );

  return await getAllRoles();
}
