import type { User, Role, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "@/domain/auth/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";
import type { Permission } from "@/domain/auth/config/permissions.config";

type UserWithRoles = User & {
  userRoles: (UserRole & { role: Role })[];
};

export function index(user: UserWithRoles): AuthenticatedUser {
  const roleSlugs = user.userRoles.map(ur => ur.role.slug as RoleSlug);

  // Collect permissions from all roles (from database)
  const permissionsSet = new Set<Permission>();
  user.userRoles.forEach(ur => {
    ur.role.permissions.forEach(p => permissionsSet.add(p as Permission));
  });
  const permissions = Array.from(permissionsSet);

  return {
    id: user.id,
    username: user.username,
    email: user.email ?? undefined,
    name: user.name,
    image: user.image,
    status: user.status,
    roles: roleSlugs,
    permissions,
    createdAt: user.createdAt,
  };
}
