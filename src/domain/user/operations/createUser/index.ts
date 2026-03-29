import "server-only";

import { prisma } from "@/lib/services/prisma";
import { createPasswordHash } from "@/domain/auth/operations/createPasswordHash";
import type { CreateUserInput, SerializedUser } from "@/domain/user/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";

export const createUser = async (data: CreateUserInput): Promise<SerializedUser> => {
  // Check if username already exists
  const existingUsername = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existingUsername) {
    throw new Error("Username already exists");
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findFirst({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw new Error("Email already exists");
  }

  // Hash password if provided and sign-in type is PASSWORD
  let passwordHash: string | null = null;
  if (data.signInType === "PASSWORD") {
    if (!data.password) {
      throw new Error("Password is required for PASSWORD sign-in type");
    }
    passwordHash = await createPasswordHash(data.password);
  }

  const user = await prisma.user.create({
    data: {
      username: data.username,
      email: data.email,
      name: data.name || null,
      passwordHash,
      signInType: data.signInType,
      status: data.status || "ACTIVE",
      emailVerified: data.signInType === "PASSWORD" ? new Date() : null,
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    status: user.status,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    roles: user.userRoles.map(ur => ur.role.slug as RoleSlug),
  };
};
