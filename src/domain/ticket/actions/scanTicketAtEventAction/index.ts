"use server";

import { QrTicketPayload } from "@/domain/ticket/types/ticket";
import { createScanLogEntry } from "@/domain/ticket/operations/createScanLogEntry";
import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import {
  TICKET_ALREADY_SCANNED_MESSAGE,
  TICKET_INVALID_HASH_MESSAGE,
  TICKET_REFUNDED_MESSAGE,
  scanTicketByPayload,
} from "@/domain/ticket/operations/scanTicketByHash";
import { getTicketSummaryForEvent } from "@/domain/ticket/operations/getTicketSummaryForEvent";
import { notifyOnTicketScanned } from "@/domain/notification/operations/notifyOnTicketScanned";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";

export const scanTicketAtEventAction = async ({
  scannedData,
}: {
  scannedData: QrTicketPayload;
}) => {
  const user = await getCurrentUser();

  assert(user, "User not authenticated");
  assert(user?.permissions.includes("tickets:scan"), "User not authorized");

  let scannedTicketData;

  try {
    scannedTicketData = await scanTicketByPayload(scannedData);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === TICKET_ALREADY_SCANNED_MESSAGE
    ) {
      return {
        success: false as const,
        reason: "already_scanned" as const,
        message: TICKET_ALREADY_SCANNED_MESSAGE,
      };
    }

    if (
      error instanceof Error &&
      error.message === TICKET_INVALID_HASH_MESSAGE
    ) {
      return {
        success: false as const,
        reason: "invalid_hash" as const,
        message: TICKET_INVALID_HASH_MESSAGE,
      };
    }

    if (
      error instanceof Error &&
      error.message === TICKET_REFUNDED_MESSAGE
    ) {
      return {
        success: false as const,
        reason: "refunded" as const,
        message: TICKET_REFUNDED_MESSAGE,
      };
    }

    return {
      success: false as const,
      reason: "unknown" as const,
      message:
        error instanceof Error ? error.message : "Ticket could not be scanned",
    };
  }

  const scanLogEntry = await createScanLogEntry({
    ticketId: scannedTicketData.id,
    userId: user.id,
    eventId: scannedData.eventId,
  });

  // Broadcast to ticket-specific channel so the ticket page updates in real-time
  await broadcastToChannel(`ticket:${scannedTicketData.shortId}`, "ticket_scanned", {
    ticketId: scannedTicketData.id,
    shortId: scannedTicketData.shortId,
    status: "SCANNED",
    scannedAt: scanLogEntry.createdAt.toISOString(),
  });

  const scanCount = await getTicketSummaryForEvent(scannedData.eventId);

  await notifyOnTicketScanned({
    eventName: scannedTicketData.eventName,
    ticketPayerEmail: scannedTicketData.ticketPayerEmail,
    ticketHolderName: scannedTicketData.ticketHolderName,
    totalTicketsScannedAtEvent: scanCount.ticketsScanned,
    totalTicketsSoldForEvent: scanCount.ticketsSold,
    totalTicketsScannedRatio: scanCount.attendedPercentage,
  });

  return { success: true as const, scannedTicketData, scanCount };
};
