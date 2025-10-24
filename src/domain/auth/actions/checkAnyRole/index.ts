import type {
  AuthenticatedUser,
  AuthorizationResult,
} from "@/domain/auth/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";

export const checkAnyRole = (
  user: AuthenticatedUser,
  roleSlugs: RoleSlug[]
): AuthorizationResult => {
  const hasRole = roleSlugs.some(slug => user.roles.includes(slug));

  if (hasRole) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `User does not have any of the required roles: ${roleSlugs.join(", ")}`,
  };
};
