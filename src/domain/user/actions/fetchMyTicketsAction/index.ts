"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import type { SerializedTicket } from "@/domain/ticket/types/ticket";

export async function fetchMyTicketsAction(): Promise<SerializedTicket[]> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  return await getTicketsByUserId(currentUser.id);
}
