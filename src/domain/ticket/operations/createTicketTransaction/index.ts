import "server-only";

import { prisma } from "@/lib/services/prisma";
import { Prisma, TicketStatus } from "@prisma/client";
import { bustOnTicketIssued } from "@/lib/services/cache";

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
  const result = await prisma.$transaction(async tx => {
    // Get order to find userId
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
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

    const ticketCount = await tx.ticket.count({
      where: { eventId, status: { not: TicketStatus.REFUNDED } },
    });

    return {
      ticketCount,
      ticket,
      userId: order?.userId ?? null,
    };
  });

  // Bust ticket caches
  await bustOnTicketIssued(result.ticket.id, result.userId, eventId);

  return {
    ticketCount: result.ticketCount,
    ticket: result.ticket,
  };
};
