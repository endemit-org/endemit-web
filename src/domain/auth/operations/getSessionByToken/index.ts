import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getSessionByToken = async (sessionToken: string) => {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
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
