import "server-only";

import type { UserWithRelations } from "@/domain/auth/types";
import { prisma } from "@/lib/services/prisma";

export const getUserByUsernameWithRoles = async (
  username: string
): Promise<UserWithRelations | null> => {
  const user = await prisma.user.findUnique({
    where: { username },
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
