"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getTicketsForEvent } from "@/domain/ticket/operations/getTicketsForEvent";
import { serializeTicket } from "@/domain/ticket/util";

export async function fetchTicketsForEvent(eventId: string) {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TICKETS_READ_ALL),
    "User not authorized to read tickets"
  );

  const tickets = await getTicketsForEvent(eventId);

  const serializedTickets = tickets.map(ticket => serializeTicket(ticket));

  return serializedTickets;
}
