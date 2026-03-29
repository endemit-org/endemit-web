import "server-only";

import { prisma } from "@/lib/services/prisma";
import { OrderStatus } from "@prisma/client";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { createTransaction } from "@/domain/wallet/operations/createTransaction";
import { queueNewOrderAutomation } from "@/domain/order/operations/queueNewOrderAutomation";
import { transformTicketsFromOrder } from "@/domain/order/transformers/transformTicketsFromOrder";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { subscribeEmailToTicketBuyerList } from "@/domain/newsletter/actions/subscribeEmailToTicketBuyerList";
import { notifyOnNewSubscriber } from "@/domain/notification/operations/notifyOnNewSubscriber";
import { queueTicketIssueAutomation } from "@/domain/ticket/operations/queueTicketIssueAutomation";

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

  // Process order automation (same as onOrderPaymentComplete)
  await queueNewOrderAutomation({ orderId: updatedOrder.id });

  // Process tickets if applicable
  const ticketItems = transformTicketsFromOrder(updatedOrder);

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

      const eventData = await fetchEventFromCmsById(relatedEvent);
      if (!ticketHolders || !eventData) {
        console.error("Missing ticket holders or event data", {
          orderId,
          ticketHolders,
          eventData,
        });
        continue;
      }

      const subscriptionResponse = await subscribeEmailToTicketBuyerList(
        updatedOrder.email,
        eventData.uid
      );
      if (subscriptionResponse) {
        await notifyOnNewSubscriber(updatedOrder.email, "Ticket buyers Newsletter");
      }

      ticketHolders.forEach(ticketHolderName => {
        queueTicketIssueAutomation({
          eventId: eventData.id,
          eventName: eventData.name,
          ticketHolderName,
          ticketPayerEmail: updatedOrder.email,
          price: ticketItem.price,
          orderId: updatedOrder.id,
          metadata: {
            productName: ticketItem.name ?? "Default",
            eventUid: eventData.uid,
          },
        });
      });
    }
  }

  return updatedOrder;
};
