import "server-only";

import type { Prisma, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import {
  parseTicketQrCode,
  verifyTicketQrMac,
} from "@/domain/ticket/operations/ticketQrCode";
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

export const TICKET_WRONG_EVENT_MESSAGE =
  "This ticket is for a different event.";

export const TICKET_NOT_FOUND_MESSAGE = "Ticket not found";

export type TicketScanFailureReason =
  | "not_found"
  | "invalid_code"
  | "wrong_event"
  | "refunded"
  | "cancelled"
  | "already_scanned";

type TicketWithOwner = Prisma.TicketGetPayload<{
  include: { order: { select: { userId: true } } };
}>;

/**
 * Thrown for every expected scan rejection. `ticket` is attached only once the
 * ticket is authenticated (valid code, or a staff lookup by shortId), so the
 * door can see whose ticket was rejected.
 */
export class TicketScanError extends Error {
  constructor(
    public readonly reason: TicketScanFailureReason,
    message: string,
    public readonly ticket?: TicketWithOwner
  ) {
    super(message);
    this.name = "TicketScanError";
  }
}

interface ScanOptions {
  /** Reject tickets that belong to another event. */
  eventId?: string;
}

const findTicket = (where: Prisma.TicketWhereUniqueInput) =>
  prisma.ticket.findUnique({
    where,
    include: { order: { select: { userId: true } } },
  });

const markTicketScanned = async (
  ticket: TicketWithOwner,
  options: ScanOptions
) => {
  if (options.eventId && ticket.eventId !== options.eventId) {
    throw new TicketScanError(
      "wrong_event",
      TICKET_WRONG_EVENT_MESSAGE,
      ticket
    );
  }

  if (ticket.status === "REFUNDED") {
    throw new TicketScanError("refunded", TICKET_REFUNDED_MESSAGE, ticket);
  }

  if (ticket.status === "CANCELLED" || ticket.status === "BANNED") {
    throw new TicketScanError("cancelled", TICKET_CANCELLED_MESSAGE, ticket);
  }

  // Conditional update: two doors scanning the same code at the same moment
  // can't both get a first-entry result.
  const { count } = await prisma.ticket.updateMany({
    where: {
      id: ticket.id,
      attended: false,
      scanCount: 0,
      status: { notIn: ["SCANNED", "REFUNDED", "CANCELLED", "BANNED"] },
    },
    data: {
      attended: true,
      status: "SCANNED",
      scanCount: { increment: 1 },
    },
  });

  if (count === 0) {
    throw new TicketScanError(
      "already_scanned",
      TICKET_ALREADY_SCANNED_MESSAGE,
      ticket
    );
  }

  const updatedTicket: TicketWithOwner = {
    ...ticket,
    attended: true,
    status: "SCANNED" satisfies TicketStatus,
    scanCount: ticket.scanCount + 1,
  };

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

/** Legacy API path: the stored ticket hash identifies the ticket. */
export const scanTicketByHash = async (ticketHash: string) => {
  const ticket = await findTicket({ ticketHash });

  if (!ticket) {
    throw new TicketScanError("not_found", TICKET_NOT_FOUND_MESSAGE);
  }

  return markTicketScanned(ticket, {});
};

/**
 * Scan the compact QR code (`E2.<shortId>.<mac>`). The MAC is recomputed from
 * the ticket's current order, so a code issued before a transfer is rejected.
 */
export const scanTicketByCode = async (
  code: string,
  options: ScanOptions = {}
) => {
  const parsed = parseTicketQrCode(code);

  if (!parsed) {
    throw new TicketScanError("invalid_code", TICKET_INVALID_HASH_MESSAGE);
  }

  const ticket = await findTicket({ shortId: parsed.shortId });

  if (!ticket || !verifyTicketQrMac(parsed.mac, ticket)) {
    throw new TicketScanError("invalid_code", TICKET_INVALID_HASH_MESSAGE);
  }

  return markTicketScanned(ticket, options);
};

/**
 * Staff fallback when the QR can't be read: look the ticket up by the short id
 * printed on it. No code is checked, so callers must authorize the user.
 */
export const scanTicketByShortId = async (
  shortId: string,
  options: ScanOptions = {}
) => {
  const ticket = await findTicket({ shortId: shortId.trim().toUpperCase() });

  if (!ticket) {
    throw new TicketScanError("not_found", TICKET_NOT_FOUND_MESSAGE);
  }

  return markTicketScanned(ticket, options);
};
