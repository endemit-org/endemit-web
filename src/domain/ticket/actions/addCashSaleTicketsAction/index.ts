"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createDoorSaleTickets } from "@/domain/ticket/operations/createDoorSaleTickets";
import { serializeTicket } from "@/domain/ticket/util";
import { inngest } from "@/lib/services/inngest";
import { TicketQueueEvent } from "@/domain/ticket/types/ticket";
import { customAlphabet } from "nanoid";
import type { DoorSaleTicketProcessData } from "@/domain/ticket/operations/runDoorSaleTicketAutomation";
import { queueOrderNewsletterSubscription } from "@/domain/newsletter/operations/queueOrderNewsletterSubscription";
import { ProductCategory } from "@/domain/product/types/product";
import type { ProductInOrder } from "@/domain/order/types/order";

interface AddCashSaleTicketsInput {
  eventId: string;
  eventName: string;
  ticketHolders: Array<{ name: string }>;
  /** Total cash received for all tickets together, in cents. */
  totalPrice: number;
  ticketHolderEmail?: string;
  sendEmail: boolean;
}

interface AddCashSaleTicketsResult {
  success: boolean;
  tickets?: ReturnType<typeof serializeTicket>[];
  ticketCount?: number;
  totalAmount?: number;
  error?: string;
}

/**
 * Admin cash sale: same backend as scanner door sales, but tickets always
 * stay PENDING and each ticket carries an assigned holder name.
 */
export async function addCashSaleTicketsAction(
  input: AddCashSaleTicketsInput
): Promise<AddCashSaleTicketsResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    if (!user.permissions.includes(PERMISSIONS.TICKETS_CREATE)) {
      return { success: false, error: "User not authorized to create tickets" };
    }

    const { eventId, eventName, ticketHolders, totalPrice, ticketHolderEmail, sendEmail } = input;

    if (!eventId || !eventName || !ticketHolders.length || totalPrice < 0) {
      return { success: false, error: "Missing required fields" };
    }

    for (const holder of ticketHolders) {
      if (!holder.name.trim()) {
        return { success: false, error: "All ticket holder names are required" };
      }
    }

    const result = await createDoorSaleTickets({
      eventId,
      eventName,
      quantity: ticketHolders.length,
      totalPrice,
      ticketHolderEmail,
      createdByUserId: user.id,
      markScanned: false,
      ticketHolders,
    });

    const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
    const batchId = `batch_cashsale_${nanoid()}`;
    const createdByUserName = user.username ?? user.email ?? "Unknown";

    if (sendEmail && ticketHolderEmail) {
      const events = result.tickets.map((ticket, index) => ({
        name: TicketQueueEvent.PROCESS_DOOR_SALE_TICKET,
        data: {
          ticketId: ticket.id,
          eventId,
          eventName,
          ticketHolderEmail,
          sendEmail: true,
          batchId,
          batchSize: result.tickets.length,
          batchIndex: index,
          totalAmount: result.totalAmount,
          createdByUserName,
        } satisfies DoorSaleTicketProcessData,
      }));

      await inngest.send(events);
    } else {
      // Still send one event for the Discord notification (no email)
      await inngest.send({
        name: TicketQueueEvent.PROCESS_DOOR_SALE_TICKET,
        data: {
          ticketId: result.tickets[0].id,
          eventId,
          eventName,
          ticketHolderEmail: ticketHolderEmail || "",
          sendEmail: false,
          batchId,
          batchSize: result.tickets.length,
          batchIndex: 0,
          totalAmount: result.totalAmount,
          createdByUserName,
        } satisfies DoorSaleTicketProcessData,
      });
    }

    // Same Email Octopus treatment as store ticket orders (skips placeholders)
    if (ticketHolderEmail) {
      await queueOrderNewsletterSubscription({
        email: ticketHolderEmail,
        items: [{ category: ProductCategory.TICKETS } as ProductInOrder],
        ticketEventIds: [eventId],
        customerName: ticketHolders[0]?.name ?? null,
      }).catch(error =>
        console.error("Failed to queue cash sale newsletter:", error)
      );
    }

    return {
      success: true,
      tickets: result.tickets.map(t => serializeTicket(t)),
      ticketCount: result.tickets.length,
      totalAmount: result.totalAmount,
    };
  } catch (error) {
    console.error("Error creating cash sale tickets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tickets",
    };
  }
}
