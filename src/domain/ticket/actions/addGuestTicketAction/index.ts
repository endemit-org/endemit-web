"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createGuestTickets } from "@/domain/ticket/operations/createGuestTicket";
import { serializeTicket } from "@/domain/ticket/util";
import { inngest } from "@/lib/services/inngest";
import { TicketQueueEvent } from "@/domain/ticket/types/ticket";
import { customAlphabet } from "nanoid";
import type { GuestTicketProcessData } from "@/domain/ticket/operations/runGuestTicketAutomation";

interface TicketHolder {
  name: string;
}

interface AddGuestTicketsInput {
  eventId: string;
  eventName: string;
  ticketHolders: TicketHolder[];
  ticketHolderEmail: string;
  sendEmail: boolean;
}

interface AddGuestTicketsResult {
  success: boolean;
  tickets?: ReturnType<typeof serializeTicket>[];
  ticketCount?: number;
  error?: string;
}

export async function addGuestTicketsAction(
  input: AddGuestTicketsInput
): Promise<AddGuestTicketsResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    if (!user.permissions.includes(PERMISSIONS.TICKETS_CREATE)) {
      return { success: false, error: "User not authorized to create tickets" };
    }

    const { eventId, eventName, ticketHolders, ticketHolderEmail, sendEmail } = input;

    if (!eventId || !eventName || !ticketHolders.length || !ticketHolderEmail) {
      return { success: false, error: "Missing required fields" };
    }

    // Validate all ticket holder names
    for (const holder of ticketHolders) {
      if (!holder.name.trim()) {
        return { success: false, error: "All ticket holder names are required" };
      }
    }

    // Create tickets in database
    const result = await createGuestTickets({
      eventId,
      eventName,
      ticketHolders,
      ticketHolderEmail,
      createdByUserId: user.id,
    });

    // Generate a batch ID to group these tickets together
    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
    const batchId = `batch_${nanoid()}`;
    const allHolderNames = ticketHolders.map(h => h.name).join(", ");
    const createdByUserName = user.username ?? user.email ?? "Unknown";

    // Dispatch each ticket to the queue for processing
    const events = result.tickets.map((ticket, index) => ({
      name: TicketQueueEvent.PROCESS_GUEST_TICKET,
      data: {
        ticketId: ticket.id,
        eventId,
        eventName,
        ticketHolderName: ticket.ticketHolderName,
        ticketHolderEmail,
        sendEmail,
        batchId,
        batchSize: result.tickets.length,
        batchIndex: index,
        allHolderNames,
        createdByUserName,
      } satisfies GuestTicketProcessData,
    }));

    await inngest.send(events);

    return {
      success: true,
      tickets: result.tickets.map(t => serializeTicket(t)),
      ticketCount: result.tickets.length,
    };
  } catch (error) {
    console.error("Error creating guest tickets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tickets",
    };
  }
}
