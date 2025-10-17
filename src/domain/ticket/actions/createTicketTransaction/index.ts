import { prisma } from "@/services/prisma";

export const createTicketTransaction = async ({
  eventId,
  shortId,
  eventName,
  ticketHolderName,
  ticketPayerEmail,
  ticketHash,
  price,
  qrContent,
  orderId,
  metadata,
}: {
  eventId: string;
  shortId: string;
  eventName: string;
  ticketHolderName: string;
  ticketPayerEmail: string;
  ticketHash: string;
  price: number;
  qrContent: string;
  orderId: string;
  metadata?: string;
}) => {
  return await prisma.$transaction(async tx => {
    const ticketCount = await tx.ticket.count({
      where: { eventId },
    });

    const ticket = await tx.ticket.create({
      data: {
        eventId,
        shortId,
        eventName,
        ticketHolderName,
        ticketPayerEmail,
        ticketHash,
        qrContent,
        orderId,
        price,
        metadata,
      },
    });

    return {
      ticketCount,
      ticket,
    };
  });
};
