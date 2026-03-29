import "server-only";

import { prisma } from "@/lib/services/prisma";
import type {
  SerializedUserWithSessions,
  SerializedSession,
} from "@/domain/user/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";

export const getUserById = async (
  userId: string
): Promise<SerializedUserWithSessions | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
      sessions: {
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const sessions: SerializedSession[] = user.sessions.map(session => ({
    id: session.id,
    createdAt: session.createdAt.toISOString(),
    expiresAt: session.expiresAt.toISOString(),
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
  }));

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    status: user.status,
    signInType: user.signInType,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    roles: user.userRoles.map(ur => ur.role.slug as RoleSlug),
    sessions,
  };
};
