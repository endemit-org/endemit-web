import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getSessionByToken = async (sessionToken: string) => {
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          image: true,
          status: true,
          locale: true,
          createdAt: true,
          userRoles: {
            select: {
              role: {
                select: {
                  slug: true,
                  permissions: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return session;
};
