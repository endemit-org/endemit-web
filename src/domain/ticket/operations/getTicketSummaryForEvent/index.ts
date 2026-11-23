import "server-only";

import { getTicketsSoldForEvent } from "@/domain/ticket/operations/getTicketsSoldForEvent";
import { getTicketsScannedForEvent } from "@/domain/ticket/operations/getTicketsScannedForEvent";

export const getTicketSummaryForEvent = async (eventId: string) => {
  const [ticketsSold, ticketsScanned] = await Promise.all([
    getTicketsSoldForEvent(eventId),
    getTicketsScannedForEvent(eventId),
  ]);

  return {
    ticketsSold,
    ticketsScanned,
    attendedPercentage: ticketsScanned / ticketsSold,
  };
};
