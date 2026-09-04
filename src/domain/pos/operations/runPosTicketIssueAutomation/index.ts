import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { customAlphabet } from "nanoid";
import { issuePosOrderTickets } from "@/domain/pos/operations/issuePosOrderTickets";
import { TicketQueueEvent } from "@/domain/ticket/types/ticket";
import type { DoorSaleTicketProcessData } from "@/domain/ticket/operations/runDoorSaleTicketAutomation";

export interface PosTicketIssueEventData {
  posOrderId: string;
  buyerEmail?: string;
}

/**
 * Durable follow-up to a paid POS order with ticket-linked items. The
 * payment request already issued the tickets synchronously (so the receipt
 * prints with them); this makes sure they exist even if that failed, then
 * queues the standard door-sale processing (email with QR when we have an
 * address, Discord notification either way) and tells the register/customer.
 */
export const runPosTicketIssueAutomation = inngest.createFunction(
  {
    id: "pos-ticket-issue",
    retries: 3,
    triggers: [{ event: "pos/tickets.issue" }],
  },
  async ({ event, step }) => {
    const { posOrderId, buyerEmail } = event.data as PosTicketIssueEventData;

    const issued = await step.run("ensure-tickets", async () => {
      return await issuePosOrderTickets(posOrderId, buyerEmail);
    });
    if (issued.groups.length === 0) {
      return { issued: 0, reason: "Order not paid or has no ticket items" };
    }

    const order = await step.run("load-order", async () => {
      return await prisma.posOrder.findUnique({
        where: { id: posOrderId },
        select: {
          registerId: true,
          seller: { select: { username: true, email: true } },
        },
      });
    });
    if (!order) {
      return { issued: 0, reason: "Order not found" };
    }

    let total = 0;
    for (const group of issued.groups) {
      await step.run(`queue-processing-${group.orderItemId}`, async () => {
        const nanoid = customAlphabet(
          "abcdefghijklmnopqrstuvwxyz0123456789",
          12
        );
        const batchId = `batch_pos_${nanoid()}`;
        const createdByUserName =
          order.seller.username ?? order.seller.email ?? "POS";
        const sendEmail = Boolean(issued.email);

        const events = (
          sendEmail ? group.tickets : group.tickets.slice(0, 1)
        ).map((ticket, index) => ({
          name: TicketQueueEvent.PROCESS_DOOR_SALE_TICKET,
          data: {
            ticketId: ticket.id,
            eventId: group.eventId,
            eventName: group.eventName,
            ticketHolderEmail: issued.email ?? "",
            sendEmail,
            batchId,
            batchSize: group.tickets.length,
            batchIndex: index,
            totalAmount: group.totalAmount,
            createdByUserName,
          } satisfies DoorSaleTicketProcessData,
        }));
        await inngest.send(events);
      });
      total += group.tickets.length;
    }

    // Tell the register and the order's customer that tickets exist (the
    // customer's profile now lists them)
    await step.run("broadcast-tickets-issued", async () => {
      const payload = { orderId: posOrderId, ticketCount: total };
      await Promise.all([
        broadcastToChannel(
          `pos:register:${order.registerId}`,
          "pos_tickets_issued",
          payload
        ),
        broadcastToChannel(
          `pos:order:${posOrderId}`,
          "pos_tickets_issued",
          payload
        ),
      ]);
    });

    return { issued: total };
  }
);
