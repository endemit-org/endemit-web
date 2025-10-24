import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getTicketsForEvent = async (eventId: string) => {
  return await prisma.ticket.findMany({
    where: {
      eventId,
    },
  });
};
