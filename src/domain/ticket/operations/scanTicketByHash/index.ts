import "server-only";

import { prisma } from "@/lib/services/prisma";
import { verifyTicketHash } from "@/domain/ticket/operations/verifyTicketHash";
import type { QrTicketPayload } from "@/domain/ticket/types/ticket";
import { bustOnTicketScanned } from "@/lib/services/cache";
import { scheduleTicketPassUpdate } from "@/domain/wallet-pass/operations/notifyTicketPassUpdate";

export const TICKET_ALREADY_SCANNED_MESSAGE =
  "This ticket has already been scanned.";

export const TICKET_INVALID_HASH_MESSAGE =
  "Invalid ticket - hash verification failed.";

export const TICKET_REFUNDED_MESSAGE =
  "This ticket has been refunded and is no longer valid.";

export const TICKET_CANCELLED_MESSAGE =
  "This ticket has been cancelled and is no longer valid.";

export const TICKET_SUPERSEDED_MESSAGE =
  "This QR code is outdated - the ticket was transferred to someone else.";

export const scanTicketByHash = async (ticketHash: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: {
      ticketHash: ticketHash,
    },
    include: {
      order: { select: { userId: true } },
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status === "REFUNDED") {
    throw new Error(TICKET_REFUNDED_MESSAGE);
  }

  if (ticket.status === "CANCELLED" || ticket.status === "BANNED") {
    throw new Error(TICKET_CANCELLED_MESSAGE);
  }

  if (ticket.attended || ticket.status === "SCANNED" || ticket.scanCount > 0) {
    throw new Error(TICKET_ALREADY_SCANNED_MESSAGE);
  }

  const updatedTicket = await prisma.ticket.update({
    where: {
      ticketHash: ticketHash,
    },
    data: {
      attended: true,
      status: "SCANNED",
      scanCount: { increment: 1 },
    },
  });

  await bustOnTicketScanned(
    updatedTicket.id,
    updatedTicket.shortId,
    updatedTicket.eventId,
    ticket.order.userId
  );

  // Apple Wallet: flip the pass STATUS to USED (barcode stays)
  scheduleTicketPassUpdate(updatedTicket.id);

  return updatedTicket;
};

/**
 * Scan a ticket using the full QR payload.
 * Looks up ticket by shortId and verifies the hash cryptographically.
 * This supports rotating hashes that aren't stored in the database (the
 * ticket page re-salts the QR every few seconds), so the hash itself can't be
 * compared to ticket.ticketHash. Instead the signed payload must still belong
 * to the ticket's current order: a transfer moves the ticket to a new order,
 * which makes every QR issued to the previous owner (email, PNG, Wallet pass,
 * screenshot) fail here.
 */
export const scanTicketByPayload = async (payload: QrTicketPayload) => {
  // Look up ticket by shortId instead of hash
  const ticket = await prisma.ticket.findUnique({
    where: {
      shortId: payload.shortId,
    },
    include: {
      order: { select: { userId: true } },
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  // Verify the hash cryptographically
  const isValidHash = verifyTicketHash(payload);
  if (!isValidHash) {
    throw new Error(TICKET_INVALID_HASH_MESSAGE);
  }

  if (payload.orderId !== ticket.orderId) {
    throw new Error(TICKET_SUPERSEDED_MESSAGE);
  }

  if (ticket.status === "REFUNDED") {
    throw new Error(TICKET_REFUNDED_MESSAGE);
  }

  if (ticket.status === "CANCELLED" || ticket.status === "BANNED") {
    throw new Error(TICKET_CANCELLED_MESSAGE);
  }

  if (ticket.attended || ticket.status === "SCANNED" || ticket.scanCount > 0) {
    throw new Error(TICKET_ALREADY_SCANNED_MESSAGE);
  }

  const updatedTicket = await prisma.ticket.update({
    where: {
      shortId: payload.shortId,
    },
    data: {
      attended: true,
      status: "SCANNED",
      scanCount: { increment: 1 },
    },
  });

  await bustOnTicketScanned(
    updatedTicket.id,
    updatedTicket.shortId,
    updatedTicket.eventId,
    ticket.order.userId
  );

  // Apple Wallet: flip the pass STATUS to USED (barcode stays)
  scheduleTicketPassUpdate(updatedTicket.id);

  return updatedTicket;
};
