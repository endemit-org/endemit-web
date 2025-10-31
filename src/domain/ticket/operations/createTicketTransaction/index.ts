import "server-only";

import { prisma } from "@/lib/services/prisma";
import { Prisma } from "@prisma/client";

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
  qrContent: Prisma.InputJsonValue;
  orderId: string;
  metadata?: Prisma.InputJsonValue;
}) => {
  return await prisma.$transaction(async tx => {
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

    const ticketCount = await tx.ticket.count({
      where: { eventId },
    });

    return {
      ticketCount,
      ticket,
    };
  });
};
