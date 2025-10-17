import { getTicketsSoldForEvent } from "@/domain/ticket/actions/getTicketsSoldForEvent";
import { getTicketsScannedForEvent } from "@/domain/ticket/actions/getTicketsScannedForEvent";

export const getTicketSummaryForEvent = async (eventId: string) => {
  const ticketsSold = await getTicketsSoldForEvent(eventId);
  const ticketsScanned = await getTicketsScannedForEvent(eventId);

  return {
    ticketsSold,
    ticketsScanned,
    attendedPercentage: ticketsScanned / ticketsSold,
  };
};
