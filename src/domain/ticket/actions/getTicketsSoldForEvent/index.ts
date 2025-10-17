import { prisma } from "@/services/prisma";

export const getTicketsSoldForEvent = async (eventId: string) => {
  return await prisma.ticket.count({
    where: {
      id: eventId,
    },
  });
};
