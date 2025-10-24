"use server";

import { getTicketsForEvent } from "@/domain/ticket/operations/getTicketsForEvent";
import { serializeTicket } from "@/domain/ticket/util";

export async function fetchTicketsForEvent(eventId: string) {
  const tickets = await getTicketsForEvent(eventId);

  const serializedTickets = tickets.map(ticket => serializeTicket(ticket));

  return serializedTickets;
}
