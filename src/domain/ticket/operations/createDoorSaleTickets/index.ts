import "server-only";

import { prisma } from "@/lib/services/prisma";
import { Ticket } from "@prisma/client";
import { generateShortId } from "@/domain/ticket/actions/generateShortId";
import { generateSecureHash } from "@/domain/ticket/operations/generateSecureHash";
import { transformToQrContent } from "@/domain/ticket/transformers/transformToQrContent";
import { TicketPayload } from "@/domain/ticket/types/ticket";
import { customAlphabet } from "nanoid";

const DOOR_SALE_PLACEHOLDER_EMAIL = "doorsale@import.endemit.org";
const DOOR_SALE_PLACEHOLDER_NAME = "Door Sale";

interface CreateDoorSaleTicketsInput {
  eventId: string;
  eventName: string;
  quantity: number;
  totalPrice: number;
  ticketHolderEmail?: string;
  createdByUserId: string;
}

export const createDoorSaleTickets = async ({
  eventId,
  eventName,
  quantity,
  totalPrice,
  ticketHolderEmail,
  createdByUserId,
}: CreateDoorSaleTicketsInput) => {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
  const doorSaleSessionId = `doorsale_${nanoid()}`;
  const email = ticketHolderEmail || DOOR_SALE_PLACEHOLDER_EMAIL;
  const totalAmount = totalPrice;
  const pricePerTicket = Math.round(totalPrice / quantity);

  return await prisma.$transaction(async tx => {
    // Create a door sale order (cash payment)
    const doorSaleOrder = await tx.order.create({
      data: {
        stripeSession: doorSaleSessionId,
        name: `Door Sale x${quantity}`,
        email,
        subtotal: totalAmount / 100,
        totalAmount: totalAmount / 100,
        shippingAmount: 0,
        discountAmount: 0,
        shippingRequired: false,
        items: [],
        metadata: {
          isDoorSale: true,
          createdByUserId,
          ticketCount: quantity,
          cashReceived: totalAmount,
        },
        status: "PAID",
      },
    });

    // Create tickets
    const tickets: Ticket[] = [];

    for (let i = 0; i < quantity; i++) {
      const shortId = await generateShortId();
      const ticketPayload: TicketPayload = {
        eventId,
        eventName,
        ticketHolderName: DOOR_SALE_PLACEHOLDER_NAME,
        ticketPayerEmail: email,
        orderId: doorSaleOrder.id,
        price: pricePerTicket / 100,
        shortId,
      };

      const ticketHash = generateSecureHash(ticketPayload);
      const qrContent = transformToQrContent(ticketHash, ticketPayload);

      const ticket = await tx.ticket.create({
        data: {
          shortId,
          orderId: doorSaleOrder.id,
          eventId,
          eventName,
          ticketHolderName: DOOR_SALE_PLACEHOLDER_NAME,
          ticketPayerEmail: email,
          ticketHash,
          price: pricePerTicket / 100,
          qrContent: JSON.parse(JSON.stringify(qrContent)),
          isGuestList: false,
          isDoorSale: true,
          status: "SCANNED",
          scanCount: 1,
          attended: true,
          metadata: {
            createdByUserId,
            isDoorSale: true,
          },
        },
      });

      tickets.push(ticket);
    }

    const doorSaleTicketCount = await tx.ticket.count({
      where: { eventId, isDoorSale: true },
    });

    return {
      tickets,
      order: doorSaleOrder,
      doorSaleTicketCount,
      totalAmount,
    };
  });
};
