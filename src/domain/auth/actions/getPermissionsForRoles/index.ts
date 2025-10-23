import type { Permission } from "@/domain/auth/config/permissions.config";
import { getRoleBySlug } from "@/domain/auth/actions/getRoleBySlug";
import { RoleSlug } from "@/domain/auth/config/roles.config";

export const getPermissionsForRoles = (roleSlugs: RoleSlug[]): Permission[] => {
  const permissionsSet = new Set<Permission>();

  roleSlugs.forEach(slug => {
    const role = getRoleBySlug(slug);
    if (role) {
      role.permissions.forEach(permission => permissionsSet.add(permission));
    }
  });

  return Array.from(permissionsSet);
};
