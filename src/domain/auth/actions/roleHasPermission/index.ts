import type { Permission } from "@/domain/auth/config/permissions.config";
import { getRoleBySlug } from "@/domain/auth/actions/getRoleBySlug";
import { RoleSlug } from "@/domain/auth/config/roles.config";

export const roleHasPermission = (
  roleSlug: RoleSlug,
  permission: Permission
): boolean => {
  const role = getRoleBySlug(roleSlug);
  return role ? role.permissions.includes(permission) : false;
};
