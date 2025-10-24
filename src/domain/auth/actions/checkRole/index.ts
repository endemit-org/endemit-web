import type {
  AuthenticatedUser,
  AuthorizationResult,
} from "@/domain/auth/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";

export const checkRole = (
  user: AuthenticatedUser,
  roleSlug: RoleSlug
): AuthorizationResult => {
  if (user.roles.includes(roleSlug)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `User does not have role: ${roleSlug}`,
  };
};
