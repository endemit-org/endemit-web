import type {
  AuthenticatedUser,
  AuthorizationResult,
} from "@/domain/auth/types";
import type { Permission } from "@/domain/auth/config/permissions.config";

export const checkPermission = (
  user: AuthenticatedUser,
  permission: Permission
): AuthorizationResult => {
  if (user.permissions.includes(permission)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `User does not have permission: ${permission}`,
  };
};
