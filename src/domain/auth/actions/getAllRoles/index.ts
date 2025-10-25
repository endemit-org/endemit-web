import {
  ROLE_DEFINITIONS,
  RoleDefinition,
} from "@/domain/auth/config/roles.config";

export const getAllRoles = (): RoleDefinition[] => {
  return Object.values(ROLE_DEFINITIONS);
};
