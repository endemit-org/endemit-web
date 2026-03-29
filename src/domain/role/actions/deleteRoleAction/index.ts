"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { deleteRole } from "@/domain/role/operations/deleteRole";

export async function deleteRoleAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ROLES_DELETE),
    "User not authorized to delete roles"
  );

  await deleteRole(id);
}
