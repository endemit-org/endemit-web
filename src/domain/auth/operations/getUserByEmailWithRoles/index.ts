import "server-only";

import type { UserWithRelations } from "@/domain/auth/types";
import { prisma } from "@/lib/services/prisma";

export const getUserByEmailWithRoles = async (
  email: string
): Promise<UserWithRelations | null> => {
  const user = await prisma.user.findUnique({
    where: { email },
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
