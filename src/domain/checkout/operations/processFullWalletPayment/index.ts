import "server-only";

import { prisma } from "@/lib/services/prisma";
import { OrderStatus } from "@prisma/client";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { createTransaction } from "@/domain/wallet/operations/createTransaction";
import { queueNewOrderAutomation } from "@/domain/order/operations/queueNewOrderAutomation";
import { transformTicketsFromOrder } from "@/domain/order/transformers/transformTicketsFromOrder";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { queueOrderNewsletterSubscription } from "@/domain/newsletter/operations/queueOrderNewsletterSubscription";
import { queueTicketIssueAutomation } from "@/domain/ticket/operations/queueTicketIssueAutomation";
import { ProductInOrder } from "@/domain/order/types/order";

export const processFullWalletPayment = async (orderId: string) => {
  // First, get and validate the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== OrderStatus.CREATED) {
    throw new Error("Order is not in created status");
  }

  if (!order.userId) {
    throw new Error("Order must have a user for wallet payment");
  }

  if (order.walletAmountUsed <= 0) {
    throw new Error("No wallet amount to process");
  }

  // Get wallet and verify balance
  const wallet = await getWalletByUserId(order.userId);
  if (!wallet) {
    throw new Error("Wallet not found");
  }

  if (wallet.balance < order.walletAmountUsed) {
    throw new Error("Insufficient wallet balance");
  }

  // Deduct wallet balance
  await createTransaction({
    walletId: wallet.id,
    type: "PURCHASE",
    amount: -order.walletAmountUsed,
    note: `Order #${order.id}`,
  });

  // Mark order as paid
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.PAID },
  });

  const items = updatedOrder.items as unknown as ProductInOrder[];

  // Process order automation (same as onOrderPaymentComplete)
  await queueNewOrderAutomation({ orderId: updatedOrder.id });

  // Process tickets if applicable
  const ticketItems = transformTicketsFromOrder(updatedOrder);

  // Collect event IDs from ticket items for newsletter subscription
  const ticketEventIds: string[] = [];

  if (ticketItems) {
    for (const ticketItem of ticketItems) {
      const ticketHolders = ticketItem.metadata?.ticketHolders as string[];
      const relatedEvent = ticketItem.relatedEvent;

      if (!relatedEvent) {
        console.error("Missing related event for ticket item", {
          orderId,
          ticketItem,
        });
        continue;
      }

      // Collect event ID for newsletter subscription
      ticketEventIds.push(relatedEvent);

      const eventData = await fetchEventFromCmsById(relatedEvent);
      if (!ticketHolders || !eventData) {
        console.error("Missing ticket holders or event data", {
          orderId,
          ticketHolders,
          eventData,
        });
        continue;
      }

      // Divide price by number of ticket holders for bundles
      const pricePerTicket = ticketItem.price / ticketHolders.length;

      ticketHolders.forEach(ticketHolderName => {
        queueTicketIssueAutomation({
          eventId: eventData.id,
          eventName: eventData.name,
          ticketHolderName,
          ticketPayerEmail: updatedOrder.email,
          price: pricePerTicket,
          orderId: updatedOrder.id,
          metadata: {
            productName: ticketItem.name ?? "Default",
            eventUid: eventData.uid,
          },
        });
      });
    }
  }

  // Queue newsletter subscription with tags based on order items
  // This handles: category-based tags, festival tags, Events/LastEvent fields
  // Using queue to avoid race condition with checkout's basic subscription
  await queueOrderNewsletterSubscription({
    email: updatedOrder.email,
    items,
    ticketEventIds,
    customerName: updatedOrder.name,
  });

  return updatedOrder;
};
