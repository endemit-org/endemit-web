import "server-only";

import { prisma } from "@/lib/services/prisma";

export const TICKET_ALREADY_SCANNED_MESSAGE =
  "This ticket has already been scanned.";

export const scanTicketByHash = async (ticketHash: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: {
      ticketHash: ticketHash,
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.attended || ticket.status === "SCANNED" || ticket.scanCount > 0) {
    throw new Error(TICKET_ALREADY_SCANNED_MESSAGE);
  }

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
