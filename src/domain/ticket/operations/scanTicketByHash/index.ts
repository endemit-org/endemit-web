import "server-only";

import { prisma } from "@/lib/services/prisma";

export const scanTicketByHash = async (ticketHash: string) => {
  return await prisma.ticket.update({
    where: {
      ticketHash: ticketHash,
    },
    data: {
      attended: true,
      status: "SCANNED",
      scanCount: { increment: 1 },
    },
  });
};
