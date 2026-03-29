"use server";

import assert from "node:assert";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { updateRole } from "@/domain/role/operations/updateRole";
import { getRoleById } from "@/domain/role/operations/getRoleById";
import type { UpdateRoleInput, SerializedRole } from "@/domain/role/types";

export async function updateRoleAction(
  id: string,
  input: UpdateRoleInput
): Promise<SerializedRole> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ROLES_UPDATE),
    "User not authorized to update roles"
  );

  // Check if trying to modify a system role's slug
  const existingRole = await getRoleById(id);
  assert(existingRole, "Role not found");

  if (existingRole.isSystem && input.slug && input.slug !== existingRole.slug) {
    throw new Error("Cannot change slug of system roles");
  }

  const updatedRole = await updateRole(id, input);

  // Revalidate role-related pages
  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${id}`);

  return updatedRole;
}
