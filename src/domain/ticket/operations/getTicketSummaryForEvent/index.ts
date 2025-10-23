import "server-only";

import { getTicketsSoldForEvent } from "@/domain/ticket/operations/getTicketsSoldForEvent";
import { getTicketsScannedForEvent } from "@/domain/ticket/operations/getTicketsScannedForEvent";

export const getTicketSummaryForEvent = async (eventId: string) => {
  const ticketsSold = await getTicketsSoldForEvent(eventId);
  const ticketsScanned = await getTicketsScannedForEvent(eventId);

  return {
    ticketsSold,
    ticketsScanned,
    attendedPercentage: ticketsScanned / ticketsSold,
  };
};
