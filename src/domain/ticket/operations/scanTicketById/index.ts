import "server-only";

import { prisma } from "@/lib/services/prisma";

export const scanTicketById = async (ticketHash: string) => {
  return await prisma.ticket.update({
    where: {
      ticketHash: ticketHash,
    },
    data: {
      attended: true,
      scanCount: { increment: 1 },
    },
  });
};
