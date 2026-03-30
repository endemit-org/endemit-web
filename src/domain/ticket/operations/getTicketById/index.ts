import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getTicketById = async (ticketId: string) => {
  return await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      order: {
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
        },
      },
    },
  });
};
