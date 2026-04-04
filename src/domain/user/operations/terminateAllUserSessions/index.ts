import "server-only";

import { prisma } from "@/lib/services/prisma";

export const terminateAllUserSessions = async (
  userId: string
): Promise<number> => {
  const result = await prisma.session.deleteMany({
    where: { userId },
  });

  return result.count;
};
