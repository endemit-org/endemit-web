import type {
  AuthenticatedUser,
  AuthorizationResult,
} from "@/domain/auth/types";
import type { Permission } from "@/domain/auth/config/permissions.config";

export const checkAllPermissions = (
  user: AuthenticatedUser,
  permissions: Permission[]
): AuthorizationResult => {
  const missingPermissions = permissions.filter(
    permission => !user.permissions.includes(permission)
  );

  if (missingPermissions.length === 0) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: `User is missing permissions: ${missingPermissions.join(", ")}`,
  };
};
