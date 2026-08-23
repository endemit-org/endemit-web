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
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { ProductCategory } from "@/domain/product/types/product";
import type { ProductInOrder } from "@/domain/order/types/order";

interface AddDoorSaleTicketsInput {
  eventId: string;
  eventName: string;
  quantity: number;
  totalPrice: number;
  ticketHolderEmail?: string;
  sendEmail: boolean;
}

interface AddDoorSaleTicketsResult {
  success: boolean;
  tickets?: ReturnType<typeof serializeTicket>[];
  ticketCount?: number;
  totalAmount?: number;
  error?: string;
}

export async function addDoorSaleTicketsAction(
  input: AddDoorSaleTicketsInput
): Promise<AddDoorSaleTicketsResult> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return { success: false, error: "User not authenticated" };
    }

    // Use tickets:scan permission for door sales
    if (!user.permissions.includes(PERMISSIONS.TICKETS_SCAN)) {
      return { success: false, error: "User not authorized for door sales" };
    }

    const { eventId, eventName, quantity, totalPrice, ticketHolderEmail, sendEmail } = input;

    if (!eventId || !eventName || quantity < 1 || totalPrice < 0) {
      return { success: false, error: "Missing required fields" };
    }

    // With ticket scanning enabled the door sale is scanned on the spot;
    // otherwise the ticket stays PENDING like a regular issued ticket. On a
    // CMS hiccup keep the long-standing scanned-immediately behavior.
    const event = await fetchEventFromCmsById(eventId).catch(() => null);
    const markScanned = event ? event.options.enabledTicketScanning : true;

    // Create tickets in database
    const result = await createDoorSaleTickets({
      eventId,
      eventName,
      quantity,
      totalPrice,
      ticketHolderEmail,
      createdByUserId: user.id,
      markScanned,
    });

    // Only send to Inngest if email is provided and sendEmail is true
    if (sendEmail && ticketHolderEmail) {
      const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
      const batchId = `batch_doorsale_${nanoid()}`;
      const createdByUserName = user.username ?? user.email ?? "Unknown";

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
      // Still send notification even without email
      const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
      const batchId = `batch_doorsale_${nanoid()}`;
      const createdByUserName = user.username ?? user.email ?? "Unknown";

      // Send just one event for notification (no email)
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

    // Same Email Octopus treatment as store ticket orders: create/update the
    // subscriber and merge this event into their Events/LastEvent fields.
    // The pipeline only reads `category` from items and skips placeholder
    // emails on its own.
    if (ticketHolderEmail) {
      await queueOrderNewsletterSubscription({
        email: ticketHolderEmail,
        items: [{ category: ProductCategory.TICKETS } as ProductInOrder],
        ticketEventIds: [eventId],
      }).catch(error =>
        console.error("Failed to queue door sale newsletter:", error)
      );
    }

    return {
      success: true,
      tickets: result.tickets.map(t => serializeTicket(t)),
      ticketCount: result.tickets.length,
      totalAmount: result.totalAmount,
    };
  } catch (error) {
    console.error("Error creating door sale tickets:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tickets",
    };
  }
}
