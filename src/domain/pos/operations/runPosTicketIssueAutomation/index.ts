import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { customAlphabet } from "nanoid";
import { createDoorSaleTickets } from "@/domain/ticket/operations/createDoorSaleTickets";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { TicketQueueEvent } from "@/domain/ticket/types/ticket";
import type { DoorSaleTicketProcessData } from "@/domain/ticket/operations/runDoorSaleTicketAutomation";

export interface PosTicketIssueEventData {
  posOrderId: string;
  buyerEmail?: string;
}

/**
 * Issues real event tickets for a paid POS order containing ticket-linked
 * items. Durable (Inngest retries) so a transient failure can't leave a paid
 * order without its tickets. Tickets are created unscanned — entry happens
 * at the door via the receipt QR or the buyer's profile QR.
 */
export const runPosTicketIssueAutomation = inngest.createFunction(
  {
    id: "pos-ticket-issue",
    retries: 3,
    triggers: [{ event: "pos/tickets.issue" }],
  },
  async ({ event, step }) => {
    const { posOrderId, buyerEmail } = event.data as PosTicketIssueEventData;

    const order = await step.run("load-order", async () => {
      return await prisma.posOrder.findUnique({
        where: { id: posOrderId },
        include: {
          items: { include: { item: { select: { ticketEventId: true } } } },
          seller: { select: { id: true, username: true, email: true } },
          customer: { select: { id: true, name: true, email: true } },
          tickets: { select: { id: true } },
        },
      });
    });

    if (!order || order.status !== "PAID") {
      return { issued: 0, reason: "Order not found or not paid" };
    }
    // Idempotency: Inngest retries must not double-issue
    if (order.tickets.length > 0) {
      return { issued: 0, reason: "Tickets already issued" };
    }

    const ticketItems = order.items.filter(i => i.item.ticketEventId);
    if (ticketItems.length === 0) {
      return { issued: 0, reason: "No ticket items" };
    }

    // Wallet buyers get account-linked tickets + email to their account;
    // anonymous cash/card sales use the optional buyer email if captured.
    const customerEmail = order.customer?.email ?? undefined;
    const email = customerEmail ?? buyerEmail?.trim() ?? undefined;

    let issued = 0;
    for (const orderItem of ticketItems) {
      const eventId = orderItem.item.ticketEventId!;
      const cmsEvent = await step.run(`fetch-event-${eventId}`, async () => {
        return await fetchEventFromCmsById(eventId).catch(() => null);
      });
      const eventName = cmsEvent?.name ?? orderItem.name;

      const tickets = await step.run(
        `issue-tickets-${orderItem.id}`,
        async () => {
          const result = await createDoorSaleTickets({
            eventId,
            eventName,
            quantity: orderItem.quantity,
            totalPrice: orderItem.total,
            ticketHolderEmail: email,
            createdByUserId: order.sellerId,
            markScanned: false,
            userId: order.customer?.id,
            posOrderId: order.id,
            holderName: order.customer?.name ?? undefined,
          });
          return result.tickets.map(t => ({ id: t.id }));
        }
      );

      // Queue the standard door-sale processing (email with QR when we have
      // an address, Discord notification either way)
      await step.run(`queue-processing-${orderItem.id}`, async () => {
        const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 12);
        const batchId = `batch_pos_${nanoid()}`;
        const createdByUserName =
          order.seller.username ?? order.seller.email ?? "POS";
        const sendEmail = Boolean(email);

        const events = (sendEmail ? tickets : tickets.slice(0, 1)).map(
          (ticket, index) => ({
            name: TicketQueueEvent.PROCESS_DOOR_SALE_TICKET,
            data: {
              ticketId: ticket.id,
              eventId,
              eventName,
              ticketHolderEmail: email ?? "",
              sendEmail,
              batchId,
              batchSize: tickets.length,
              batchIndex: index,
              totalAmount: orderItem.total,
              createdByUserName,
            } satisfies DoorSaleTicketProcessData,
          })
        );
        await inngest.send(events);
      });

      issued += tickets.length;
    }

    // Tell the register (auto-prints ticket slips) and the order's customer
    // that paper/profile tickets now exist
    await step.run("broadcast-tickets-issued", async () => {
      const payload = { orderId: order.id, ticketCount: issued };
      await Promise.all([
        broadcastToChannel(
          `pos:register:${order.registerId}`,
          "pos_tickets_issued",
          payload
        ),
        broadcastToChannel(
          `pos:order:${order.id}`,
          "pos_tickets_issued",
          payload
        ),
      ]);
    });

    return { issued };
  }
);
