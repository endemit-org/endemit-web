import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getTicketsScannedForEvent = async (eventId: string) => {
  return await prisma.ticket.count({
    where: {
      id: eventId,
      attended: true,
    },
  });
};
