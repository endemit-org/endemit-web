import type { Permission } from "@/domain/auth/config/permissions.config";

export interface SerializedRole {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: Permission[];
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  name?: string;
  slug?: string;
  description?: string | null;
  permissions?: Permission[];
}
