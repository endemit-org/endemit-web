"use server";

import { QrTicketPayload } from "@/domain/ticket/types/ticket";
import { createScanLogEntry } from "@/domain/ticket/operations/createScanLogEntry";
import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import {
  TICKET_ALREADY_SCANNED_MESSAGE,
  scanTicketByHash,
} from "@/domain/ticket/operations/scanTicketByHash";
import { getTicketSummaryForEvent } from "@/domain/ticket/operations/getTicketSummaryForEvent";
import { notifyOnTicketScanned } from "@/domain/notification/operations/notifyOnTicketScanned";

export const scanTicketAtEventAction = async ({
  scannedData,
}: {
  scannedData: QrTicketPayload;
}) => {
  const user = await getCurrentUser();

  assert(user, "User not authenticated");
  assert(user?.permissions.includes("tickets:scan"), "User not authorized");

  const scannedTicketData = await scanTicketByHash(scannedData.hash).catch(
    error => {
      if (
        error instanceof Error &&
        error.message === TICKET_ALREADY_SCANNED_MESSAGE
      ) {
        throw error;
      }

      throw new Error("Ticket could not be scanned");
    }
  );

  await createScanLogEntry({
    ticketId: scannedTicketData.id,
    userId: user.id,
    eventId: scannedData.eventId,
  });

  const scanCount = await getTicketSummaryForEvent(scannedData.eventId);

  notifyOnTicketScanned({
    eventName: scannedTicketData.eventName,
    ticketPayerEmail: scannedTicketData.ticketPayerEmail,
    ticketHolderName: scannedTicketData.ticketHolderName,
    totalTicketsScannedAtEvent: scanCount.ticketsScanned,
    totalTicketsSoldForEvent: scanCount.ticketsSold,
    totalTicketsScannedRatio: scanCount.attendedPercentage,
  });

  return { scannedTicketData, scanCount };
};
