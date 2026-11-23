"use server";

import assert from "node:assert";
import { after } from "next/server";
import { createScanLogEntry } from "@/domain/ticket/operations/createScanLogEntry";
import { getCurrentUser } from "@/lib/services/auth";
import {
  TicketScanError,
  scanTicketByCode,
  scanTicketByShortId,
} from "@/domain/ticket/operations/scanTicketByHash";
import { getTicketSummaryForEvent } from "@/domain/ticket/operations/getTicketSummaryForEvent";
import { notifyOnTicketScanned } from "@/domain/notification/operations/notifyOnTicketScanned";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { getTemplateById } from "@/domain/ticket/config/ticketTemplates";

type ScanInput = { eventId: string } & (
  | { code: string; shortId?: undefined }
  | { shortId: string; code?: undefined }
);

type ScannedTicket = Awaited<ReturnType<typeof scanTicketByCode>>;

const toTicketInfo = (ticket: ScannedTicket) => {
  const metadata = (ticket.metadata ?? {}) as Record<string, unknown>;
  const templateId = typeof metadata.ticketTemplate === "string" ? metadata.ticketTemplate : undefined;
  const locale = ticket.locale === "en" ? "en" : "sl";
  return {
    // What the ticket admits (whole weekend, one evening), when its design says so.
    doorLabel: getTemplateById(templateId).doorLabel?.[locale] ?? null,
    productName: typeof metadata.productName === "string" ? metadata.productName : null,
    shortId: ticket.shortId,
    ticketHolderName: ticket.ticketHolderName,
    ticketPayerEmail: ticket.ticketPayerEmail,
    price: Number(ticket.price),
    isGuestList: ticket.isGuestList,
  };
};

/**
 * Scan a ticket at the door, either from its QR code or (staff fallback) by
 * the short id printed on the ticket. Everything the scanner shows comes from
 * the database, not from the QR.
 */
export const scanTicketAtEventAction = async (input: ScanInput) => {
  const user = await getCurrentUser();

  assert(user, "User not authenticated");
  assert(user?.permissions.includes("tickets:scan"), "User not authorized");

  let scannedTicket: ScannedTicket;

  try {
    scannedTicket =
      input.code !== undefined
        ? await scanTicketByCode(input.code, { eventId: input.eventId })
        : await scanTicketByShortId(input.shortId, { eventId: input.eventId });
  } catch (error) {
    if (error instanceof TicketScanError) {
      return {
        success: false as const,
        reason: error.reason,
        message: error.message,
        ticket: error.ticket ? toTicketInfo(error.ticket) : null,
      };
    }

    console.error(error);

    return {
      success: false as const,
      reason: "unknown" as const,
      message:
        error instanceof Error ? error.message : "Ticket could not be scanned",
      ticket: null,
    };
  }

  const summary = await getTicketSummaryForEvent(scannedTicket.eventId);
  const scannedAt = new Date();

  // The door only waits for the scan itself; logging and notifications run
  // after the response is sent.
  after(async () => {
    const results = await Promise.allSettled([
      createScanLogEntry({
        ticketId: scannedTicket.id,
        userId: user.id,
        eventId: scannedTicket.eventId,
      }),
      // Ticket-specific channel so the ticket page updates in real-time
      broadcastToChannel(`ticket:${scannedTicket.shortId}`, "ticket_scanned", {
        ticketId: scannedTicket.id,
        shortId: scannedTicket.shortId,
        status: "SCANNED",
        scannedAt: scannedAt.toISOString(),
      }),
      notifyOnTicketScanned({
        eventName: scannedTicket.eventName,
        ticketPayerEmail: scannedTicket.ticketPayerEmail,
        ticketHolderName: scannedTicket.ticketHolderName,
        totalTicketsScannedAtEvent: summary.ticketsScanned,
        totalTicketsSoldForEvent: summary.ticketsSold,
        totalTicketsScannedRatio: summary.attendedPercentage,
      }),
    ]);

    for (const result of results) {
      if (result.status === "rejected") console.error(result.reason);
    }
  });

  return {
    success: true as const,
    ticket: toTicketInfo(scannedTicket),
    summary: {
      ticketsScanned: summary.ticketsScanned,
      ticketsSold: summary.ticketsSold,
    },
  };
};
