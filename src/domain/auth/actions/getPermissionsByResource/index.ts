import { getAllPermissions } from "@/domain/auth/actions/getAllPermissions";
import { Permission } from "@/domain/auth/config/permissions.config";

export const getPermissionsByResource = (resource: string): Permission[] => {
  return getAllPermissions().filter(permission =>
    permission.startsWith(`${resource}:`)
  );
};
