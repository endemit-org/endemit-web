import { RoleSlug } from "@/domain/auth/config/roles.config";
import type { Permission } from "@/domain/auth/config/permissions.config";
import { getPermissionsForRoles } from "@/domain/auth/actions/getPermissionsForRoles";

export const getUserPermissions = (roleSlugs: RoleSlug[]): Permission[] => {
  return getPermissionsForRoles(roleSlugs);
};
