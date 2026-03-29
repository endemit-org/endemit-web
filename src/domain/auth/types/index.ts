import type { User, Session, Role, UserRole, UserStatus, SignInType, OtcToken } from "@prisma/client";
import type { Permission } from "@/domain/auth/config/permissions.config";
import type { RoleSlug } from "@/domain/auth/config/roles.config";

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
  username: string;
  email?: string;
  name: string | null;
  image: string | null;
  status: UserStatus;
  roles: RoleSlug[];
  permissions: Permission[];
  createdAt: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
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
  username?: string;
  email?: string;
  image?: string;
  status?: UserStatus;
  emailVerified?: Date | null;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
}

export interface OtcRequestResult {
  success: boolean;
  error?: string;
  rateLimitRemaining?: number;
}

export interface OtcVerifyResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export interface CreateOtcTokenData {
  userId: string;
  code: string;
  magicLink: string;
  expiresAt: Date;
}

export type { SignInType, OtcToken };

// OTC Email Queue Types
export enum OtcQueueEvent {
  SEND_OTC_EMAIL = "send-otc-email",
}

export interface OtcEmailQueueData {
  email: string;
  code: string;
  magicLink: string;
  expiresInMinutes: number;
}
