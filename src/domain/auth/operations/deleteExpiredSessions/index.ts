import "server-only";

import { prisma } from "@/lib/services/prisma";

export const deleteExpiredSessions = async () => {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
};
