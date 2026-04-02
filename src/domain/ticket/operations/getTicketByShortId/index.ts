import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getTicketByShortId = async (shortId: string) => {
  return await prisma.ticket.findUnique({
    where: { shortId },
    include: {
      order: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          userId: true,
        },
      },
      ScanLog: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: {
          createdAt: true,
        },
      },
    },
  });
};
