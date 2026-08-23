import "server-only";

import { prisma } from "@/lib/services/prisma";
import { Ticket } from "@prisma/client";
import { generateShortId } from "@/domain/ticket/actions/generateShortId";
import { generateSecureHash } from "@/domain/ticket/operations/generateSecureHash";
import { transformToQrContent } from "@/domain/ticket/transformers/transformToQrContent";
import { TicketPayload } from "@/domain/ticket/types/ticket";
import { customAlphabet } from "nanoid";
import { bustOnOrderCreated, bustOnTicketIssued } from "@/lib/services/cache";

const DOOR_SALE_PLACEHOLDER_EMAIL = "doorsale@import.endemit.org";
const DOOR_SALE_PLACEHOLDER_NAME = "Door Sale";

interface CreateDoorSaleTicketsInput {
  eventId: string;
  eventName: string;
  quantity: number;
  totalPrice: number;
  ticketHolderEmail?: string;
  createdByUserId: string;
  /**
   * When the event has ticket scanning enabled the door sale is scanned on
   * the spot (the buyer walks in); without scanning the ticket stays
   * PENDING like a regular issued ticket.
   */
  markScanned?: boolean;
  /**
   * Per-ticket holder names (admin cash sales). When provided, one ticket is
   * created per holder and `quantity` is ignored; otherwise all tickets get
   * the door-sale placeholder name.
   */
  ticketHolders?: Array<{ name: string }>;
  /**
   * POS register sales: link the backing order to a user account (wallet
   * buyers see the tickets in their profile) and stamp the POS order id on
   * each ticket (reversal + receipt QR rendering).
   */
  userId?: string;
  posOrderId?: string;
  /** Holder name for all tickets when ticketHolders is not used. */
  holderName?: string;
}

export const createDoorSaleTickets = async ({
  eventId,
  eventName,
  quantity,
  totalPrice,
  ticketHolderEmail,
  createdByUserId,
  markScanned = true,
  ticketHolders,
  userId,
  posOrderId,
  holderName: defaultHolderName,
}: CreateDoorSaleTicketsInput) => {
  const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
  const doorSaleSessionId = `doorsale_${nanoid()}`;
  const email = ticketHolderEmail || DOOR_SALE_PLACEHOLDER_EMAIL;
  const ticketCount = ticketHolders?.length ?? quantity;
  const totalAmount = totalPrice;
  const pricePerTicket = Math.round(totalPrice / ticketCount);

  const result = await prisma.$transaction(async tx => {
    // Create a door sale order (cash payment)
    const doorSaleOrder = await tx.order.create({
      data: {
        stripeSession: doorSaleSessionId,
        name: `Door Sale x${ticketCount}`,
        email,
        ...(userId && { userId }),
        subtotal: totalAmount / 100,
        totalAmount: totalAmount / 100,
        shippingAmount: 0,
        discountAmount: 0,
        shippingRequired: false,
        items: [],
        metadata: {
          isDoorSale: true,
          createdByUserId,
          ticketCount,
          cashReceived: totalAmount,
        },
        status: "COMPLETED",
      },
    });

    // Create tickets
    const tickets: Ticket[] = [];

    for (let i = 0; i < ticketCount; i++) {
      const holderName =
        ticketHolders?.[i]?.name?.trim() ||
        defaultHolderName?.trim() ||
        DOOR_SALE_PLACEHOLDER_NAME;
      const shortId = await generateShortId();
      const ticketPayload: TicketPayload = {
        eventId,
        eventName,
        ticketHolderName: holderName,
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
          ticketHolderName: holderName,
          ticketPayerEmail: email,
          ticketHash,
          price: pricePerTicket / 100,
          qrContent: JSON.parse(JSON.stringify(qrContent)),
          isGuestList: false,
          isDoorSale: true,
          ...(posOrderId && { posOrderId }),
          status: markScanned ? "SCANNED" : "PENDING",
          scanCount: markScanned ? 1 : 0,
          attended: markScanned,
          metadata: {
            createdByUserId,
            isDoorSale: true,
            ...(posOrderId && { posOrderId }),
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

  // Bust caches after transaction completes
  await bustOnOrderCreated(result.order.id, null);
  for (const ticket of result.tickets) {
    await bustOnTicketIssued(ticket.id, null, eventId);
  }

  return result;
};
