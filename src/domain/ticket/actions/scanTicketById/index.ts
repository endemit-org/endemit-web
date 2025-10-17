import { prisma } from "@/services/prisma";

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
