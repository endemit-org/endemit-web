import "server-only";

import { prisma } from "@/lib/services/prisma";

const MAX_TICKETS_PER_EVENT = 5000;

export const getTicketsForEvent = async (eventId: string, limit?: number) => {
  return await prisma.ticket.findMany({
    where: {
      eventId,
    },
    take: limit ?? MAX_TICKETS_PER_EVENT,
    orderBy: {
      createdAt: "desc",
    },
  });
};
