import type {
  AuthenticatedUser,
  AuthorizationResult,
} from "@/domain/auth/types";
import type { Permission } from "@/domain/auth/config/permissions.config";

export const checkAnyPermission = (
  user: AuthenticatedUser,
  permissions: Permission[]
): AuthorizationResult => {
  const hasPermission = permissions.some(permission =>
    user.permissions.includes(permission)
  );

  if (hasPermission) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `User does not have any of the required permissions: ${permissions.join(", ")}`,
  };
};
