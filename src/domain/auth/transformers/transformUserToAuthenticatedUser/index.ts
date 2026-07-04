import type { UserStatus } from "@prisma/client";
import type { AuthenticatedUser } from "@/domain/auth/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";
import type { Permission } from "@/domain/auth/config/permissions.config";

type UserForAuth = {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  image: string | null;
  status: UserStatus;
  locale: string;
  createdAt: Date;
  userRoles: { role: { slug: string; permissions: string[] } }[];
};

export function index(user: UserForAuth): AuthenticatedUser {
  const roleSlugs = user.userRoles.map(ur => ur.role.slug as RoleSlug);

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
    locale: user.locale,
    roles: roleSlugs,
    permissions,
    createdAt: user.createdAt,
  };
}
