import "server-only";

import { prisma } from "@/lib/services/prisma";
import { verifyTicketHash } from "@/domain/ticket/operations/verifyTicketHash";
import type { QrTicketPayload } from "@/domain/ticket/types/ticket";

export const TICKET_ALREADY_SCANNED_MESSAGE =
  "This ticket has already been scanned.";

export const TICKET_INVALID_HASH_MESSAGE =
  "Invalid ticket - hash verification failed.";

export const TICKET_REFUNDED_MESSAGE =
  "This ticket has been refunded and is no longer valid.";

export const scanTicketByHash = async (ticketHash: string) => {
  const ticket = await prisma.ticket.findUnique({
    where: {
      ticketHash: ticketHash,
    },
  });

  if (!ticket) {
    throw new Error("Ticket not found");
  }

  if (ticket.status === "REFUNDED") {
    throw new Error(TICKET_REFUNDED_MESSAGE);
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

/**
 * Scan a ticket using the full QR payload.
 * Looks up ticket by shortId and verifies the hash cryptographically.
 * This supports rotating hashes that aren't stored in the database.
 */
export const scanTicketByPayload = async (payload: QrTicketPayload) => {
  // Look up ticket by shortId instead of hash
  const ticket = await prisma.ticket.findUnique({
    where: {
      shortId: payload.shortId,
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

  if (ticket.status === "REFUNDED") {
    throw new Error(TICKET_REFUNDED_MESSAGE);
  }

  if (ticket.attended || ticket.status === "SCANNED" || ticket.scanCount > 0) {
    throw new Error(TICKET_ALREADY_SCANNED_MESSAGE);
  }

  return await prisma.ticket.update({
    where: {
      shortId: payload.shortId,
    },
    data: {
      attended: true,
      status: "SCANNED",
      scanCount: { increment: 1 },
    },
  });
};
