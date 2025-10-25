import "server-only";

import { prisma } from "@/lib/services/prisma";

export const deleteUserSessions = async (userId: string) => {
  await prisma.session.deleteMany({
    where: { userId },
  });
};
