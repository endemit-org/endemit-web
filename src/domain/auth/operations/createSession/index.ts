import "server-only";

import type { CreateSessionData } from "@/domain/auth/types";
import { generateSessionToken } from "@/domain/auth/operations/generateSessionToken";
import { prisma } from "@/lib/services/prisma";

export const createSession = async (data: CreateSessionData) => {
  const sessionToken = generateSessionToken();

  const session = await prisma.session.create({
    data: {
      userId: data.userId,
      sessionToken,
      expiresAt: data.expiresAt,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      },
    },
  });

  return session;
};
