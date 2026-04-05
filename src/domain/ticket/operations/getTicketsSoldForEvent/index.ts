import "server-only";

import { prisma } from "@/lib/services/prisma";
import { TicketStatus } from "@prisma/client";

export const getTicketsSoldForEvent = async (eventId: string) => {
  return await prisma.ticket.count({
    where: {
      eventId,
      status: { not: TicketStatus.REFUNDED },
    },
  });
};
