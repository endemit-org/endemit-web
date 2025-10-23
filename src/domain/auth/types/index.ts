import type { User, Session, Role, UserRole, UserStatus } from "@prisma/client";
import type { Permission } from "../config/permissions.config";
import type { RoleSlug } from "../config/roles.config";

export type UserWithRelations = User & {
  sessions: Session[];
  userRoles: (UserRole & {
    role: Role;
  })[];
};

export type SessionWithUser = Session & {
  user: User;
};

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  status: UserStatus;
  roles: RoleSlug[];
  permissions: Permission[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface CreateSessionData {
  userId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  image?: string;
  status?: UserStatus;
  emailVerified?: Date | null;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}
