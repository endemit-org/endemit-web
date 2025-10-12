import { prisma } from "@/services/prisma/prisma";

export const createTicket = async ({
  eventId,
  eventName,
  ticketHolderName,
  ticketPayerEmail,
  ticketHash,
  qrContent,
  orderId,
  metadata,
}: {
  eventId: string;
  eventName: string;
  ticketHolderName: string;
  ticketPayerEmail: string;
  ticketHash: string;
  qrContent: string;
  orderId: string;
  metadata?: string;
}) => {
  return await prisma.ticket.create({
    data: {
      eventId,
      eventName,
      ticketHolderName,
      ticketPayerEmail,
      ticketHash,
      qrContent,
      orderId,
      metadata,
    },
  });
};
