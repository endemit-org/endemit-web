import type { UserStatus } from "@prisma/client";
import type { RoleSlug } from "@/domain/auth/config/roles.config";

export interface SerializedUser {
  id: string;
  username: string;
  email: string | null;
  name: string | null;
  status: UserStatus;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  roles: RoleSlug[];
}

export interface SerializedUserWithSessions extends SerializedUser {
  sessions: SerializedSession[];
}

export interface SerializedSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface PaginatedUsers {
  users: SerializedUser[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateUserInput {
  username?: string;
  email?: string | null;
  name?: string | null;
  status?: UserStatus;
}

export interface CreateUserInput {
  username: string;
  email: string;
  name?: string;
  password?: string;
  signInType: "PASSWORD" | "OTC";
  status?: UserStatus;
}
