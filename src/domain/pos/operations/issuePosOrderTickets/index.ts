import "server-only";

import { prisma } from "@/lib/services/prisma";
import { createDoorSaleTickets } from "@/domain/ticket/operations/createDoorSaleTickets";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";

export interface IssuedTicketGroup {
  orderItemId: string;
  eventId: string;
  eventName: string;
  /** Line total in cents (the door-sale amount for notifications). */
  totalAmount: number;
  tickets: Array<{ id: string }>;
}

export interface IssuePosOrderTicketsResult {
  /** True when this call created the tickets (vs. found them already there). */
  created: boolean;
  /** Email the tickets are addressed to, if any (account or captured buyer). */
  email?: string;
  groups: IssuedTicketGroup[];
}

/**
 * Issue the event tickets backing a paid POS order's ticket-linked items.
 * Runs synchronously in the payment request so the receipt print that
 * follows has the ticket QRs; idempotent, so the durable Inngest follow-up
 * (`pos/tickets.issue`) can call it again as a fallback without
 * double-issuing. Tickets are created unscanned — entry happens at the door
 * via the receipt QR or the buyer's profile QR.
 */
export async function issuePosOrderTickets(
  posOrderId: string,
  buyerEmail?: string
): Promise<IssuePosOrderTicketsResult> {
  const order = await prisma.posOrder.findUnique({
    where: { id: posOrderId },
    include: {
      items: { include: { item: { select: { ticketEventId: true } } } },
      customer: { select: { id: true, name: true, email: true } },
      tickets: {
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        select: { id: true, eventId: true, eventName: true },
      },
    },
  });

  if (!order || order.status !== "PAID") {
    return { created: false, groups: [] };
  }

  // Wallet buyers get account-linked tickets + email to their account;
  // anonymous cash/card sales use the optional buyer email if captured.
  const email = order.customer?.email ?? buyerEmail?.trim() ?? undefined;
  const ticketItems = order.items.filter(i => i.item.ticketEventId);

  // Already issued (sync path ran, or a retry): regroup by line item
  if (order.tickets.length > 0) {
    return {
      created: false,
      email,
      groups: ticketItems.map(orderItem => {
        const eventId = orderItem.item.ticketEventId!;
        const tickets = order.tickets.filter(t => t.eventId === eventId);
        return {
          orderItemId: orderItem.id,
          eventId,
          eventName: tickets[0]?.eventName ?? orderItem.name,
          totalAmount: orderItem.total,
          tickets: tickets.map(t => ({ id: t.id })),
        };
      }),
    };
  }

  const groups: IssuedTicketGroup[] = [];
  for (const orderItem of ticketItems) {
    const eventId = orderItem.item.ticketEventId!;
    const cmsEvent = await fetchEventFromCmsById(eventId).catch(() => null);
    const eventName = cmsEvent?.name ?? orderItem.name;

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

    groups.push({
      orderItemId: orderItem.id,
      eventId,
      eventName,
      totalAmount: orderItem.total,
      tickets: result.tickets.map(t => ({ id: t.id })),
    });
  }

  return { created: true, email, groups };
}
