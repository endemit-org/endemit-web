import {
  ROLE_DEFINITIONS,
  RoleDefinition,
  RoleSlug,
} from "@/domain/auth/config/roles.config";

export const getRoleBySlug = (slug: RoleSlug): RoleDefinition | undefined => {
  return ROLE_DEFINITIONS[slug];
};
