import {
  Permission,
  PERMISSIONS,
} from "@/domain/auth/config/permissions.config";

export const getAllPermissions = (): Permission[] => {
  return Object.values(PERMISSIONS);
};
