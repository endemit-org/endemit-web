import type { User, Role, UserRole } from "@prisma/client";
import type { AuthenticatedUser } from "@/domain/auth/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";

import { getUserPermissions } from "@/domain/auth/actions/getUserPermissions";

type UserWithRoles = User & {
  userRoles: (UserRole & { role: Role })[];
};

export function index(user: UserWithRoles): AuthenticatedUser {
  const roleSlugs = user.userRoles.map(ur => ur.role.slug as RoleSlug);

  const permissions = getUserPermissions(roleSlugs);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    image: user.image,
    status: user.status,
    roles: roleSlugs,
    permissions,
  };
}
