"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { prisma } from "@/lib/services/prisma";
import { revalidatePath } from "next/cache";
import { generateSecureHash } from "@/domain/ticket/operations/generateSecureHash";
import { transformToQrContent } from "@/domain/ticket/transformers/transformToQrContent";
import type { TicketPayload } from "@/domain/ticket/types/ticket";
import type { Prisma } from "@prisma/client";

interface UpdateTicketHolderNameResult {
  success: boolean;
  error?: string;
  newName?: string;
  newQrContent?: unknown;
}

export async function updateTicketHolderNameAction(
  shortId: string,
  newName: string
): Promise<UpdateTicketHolderNameResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Validate input
  const trimmedName = newName.trim();
  if (!trimmedName) {
    return { success: false, error: "Name cannot be empty" };
  }

  if (trimmedName.length > 100) {
    return { success: false, error: "Name is too long" };
  }

  // Find the ticket
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
    return { success: false, error: "Not authorized to edit this ticket" };
  }

  // Only allow editing for usable tickets
  const isUsable = ticket.status === "VALIDATED" || ticket.status === "PENDING";
  if (!isUsable) {
    return { success: false, error: "Cannot edit a used or cancelled ticket" };
  }

  // Regenerate hash and QR content with new name
  const ticketPayload: TicketPayload = {
    shortId: ticket.shortId,
    eventId: ticket.eventId,
    eventName: ticket.eventName,
    ticketHolderName: trimmedName,
    ticketPayerEmail: ticket.ticketPayerEmail,
    orderId: ticket.orderId,
    price: Number(ticket.price),
  };

  const newTicketHash = generateSecureHash(ticketPayload);
  const newQrContent = transformToQrContent(newTicketHash, ticketPayload);

  // Update the ticket with new name, hash, and QR content
  await prisma.ticket.update({
    where: { shortId },
    data: {
      ticketHolderName: trimmedName,
      ticketHash: newTicketHash,
      qrContent: newQrContent as unknown as Prisma.InputJsonValue,
    },
  });

  // Revalidate the ticket page
  revalidatePath(`/profile/tickets/${shortId}`);

  return { success: true, newName: trimmedName, newQrContent };
}
