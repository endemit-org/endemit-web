"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { generateSecureHash } from "@/domain/ticket/operations/generateSecureHash";
import { transformToQrContent } from "@/domain/ticket/transformers/transformToQrContent";
import type { TicketPayload } from "@/domain/ticket/types/ticket";

interface RegenerateTicketQrResult {
  success: boolean;
  error?: string;
  qrContent?: unknown;
}

export async function regenerateTicketQrAction(
  shortId: string
): Promise<RegenerateTicketQrResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const ticket = await prisma.ticket.findUnique({
    where: { shortId },
    include: {
      order: {
        select: {
          userId: true,
          email: true,
        },
      },
    },
  });

  if (!ticket) {
    return { success: false, error: "Ticket not found" };
  }

  // Verify ownership
  const isOwner =
    ticket.order.userId === user.id ||
    ticket.order.email === user.email ||
    ticket.ticketPayerEmail === user.email;

  if (!isOwner) {
    return { success: false, error: "Not authorized" };
  }

  // Only regenerate for usable tickets
  const isUsable = ticket.status === "VALIDATED" || ticket.status === "PENDING";
  if (!isUsable) {
    return { success: false, error: "Ticket not usable" };
  }

  // Generate new hash with fresh salt (not saved to DB)
  const ticketPayload: TicketPayload = {
    shortId: ticket.shortId,
    eventId: ticket.eventId,
    eventName: ticket.eventName,
    ticketHolderName: ticket.ticketHolderName,
    ticketPayerEmail: ticket.ticketPayerEmail,
    orderId: ticket.orderId,
    price: Number(ticket.price),
  };

  const newTicketHash = generateSecureHash(ticketPayload);
  const newQrContent = transformToQrContent(newTicketHash, ticketPayload);

  return { success: true, qrContent: newQrContent };
}
