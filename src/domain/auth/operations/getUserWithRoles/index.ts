import "server-only";

import type { UserWithRelations } from "@/domain/auth/types";
import { prisma } from "@/lib/services/prisma";

export const getUserWithRoles = async (
  userId: string
): Promise<UserWithRelations | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sessions: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  return user;
};
