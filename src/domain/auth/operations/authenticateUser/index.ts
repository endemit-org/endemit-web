import "server-only";

import type { LoginCredentials } from "@/domain/auth/types";
import { prisma } from "@/lib/services/prisma";
import { isPasswordValid, isUserActive } from "@/domain/auth/businessLogic";

export const authenticateUser = async (credentials: LoginCredentials) => {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  if (!isUserActive(user.status)) {
    return null;
  }

  const isValid = await isPasswordValid(
    credentials.password,
    user.passwordHash
  );

  if (!isValid) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return user;
};
