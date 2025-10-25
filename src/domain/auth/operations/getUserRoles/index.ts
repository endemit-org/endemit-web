import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getUserRoles = async (userId: string) => {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: true,
    },
  });

  return userRoles.map(ur => ur.role);
};
