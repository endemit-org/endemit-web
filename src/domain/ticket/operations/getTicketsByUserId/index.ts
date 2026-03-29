import "server-only";

import { prisma } from "@/lib/services/prisma";
import { serializeTicket } from "@/domain/ticket/util";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";

export const getTicketsByUserId = async (
  userId: string
): Promise<SerializedTicket[]> => {
  const tickets = await prisma.ticket.findMany({
    where: {
      order: {
        userId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return tickets.map(ticket => serializeTicket(ticket));
};
