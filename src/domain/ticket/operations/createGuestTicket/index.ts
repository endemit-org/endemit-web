import "server-only";

import { prisma } from "@/lib/services/prisma";
import { Ticket } from "@prisma/client";
import { generateShortId } from "@/domain/ticket/actions/generateShortId";
import { generateSecureHash } from "@/domain/ticket/operations/generateSecureHash";
import { transformToQrContent } from "@/domain/ticket/transformers/transformToQrContent";
import { TicketPayload } from "@/domain/ticket/types/ticket";
import { customAlphabet } from "nanoid";

interface TicketHolder {
  name: string;
}

interface CreateGuestTicketsInput {
  eventId: string;
  eventName: string;
  ticketHolders: TicketHolder[];
  ticketHolderEmail: string;
  createdByUserId: string;
}

export const createGuestTickets = async ({
  eventId,
  eventName,
  ticketHolders,
  ticketHolderEmail,
  createdByUserId,
}: CreateGuestTicketsInput) => {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
  const guestSessionId = `guestlist_${nanoid()}`;

  return await prisma.$transaction(async tx => {
    // Create a guest list order (no payment)
    const guestOrder = await tx.order.create({
      data: {
        stripeSession: guestSessionId,
        name: ticketHolders.map(h => h.name).join(", "),
        email: ticketHolderEmail,
        subtotal: 0,
        totalAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        shippingRequired: false,
        items: [],
        metadata: {
          isGuestList: true,
          createdByUserId,
          ticketCount: ticketHolders.length,
        },
        status: "PAID", // Guest list tickets are already "paid" (free)
      },
    });

    // Create tickets for each holder
    const tickets: Ticket[] = [];

    for (const holder of ticketHolders) {
      const shortId = await generateShortId();
      const ticketPayload: TicketPayload = {
        eventId,
        eventName,
        ticketHolderName: holder.name,
        ticketPayerEmail: ticketHolderEmail,
        orderId: guestOrder.id,
        price: 0,
        shortId,
      };

      const ticketHash = generateSecureHash(ticketPayload);
      const qrContent = transformToQrContent(ticketHash, ticketPayload);

      const ticket = await tx.ticket.create({
        data: {
          shortId,
          orderId: guestOrder.id,
          eventId,
          eventName,
          ticketHolderName: holder.name,
          ticketPayerEmail: ticketHolderEmail,
          ticketHash,
          price: 0,
          qrContent: JSON.parse(JSON.stringify(qrContent)),
          isGuestList: true,
          metadata: {
            createdByUserId,
            isGuestList: true,
          },
        },
      });

      tickets.push(ticket);
    }

    const guestTicketCount = await tx.ticket.count({
      where: { eventId, isGuestList: true },
    });

    return {
      tickets,
      order: guestOrder,
      guestTicketCount,
    };
  });
};
