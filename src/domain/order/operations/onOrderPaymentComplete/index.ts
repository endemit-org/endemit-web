import "server-only";

import { queueNewOrderAutomation } from "@/domain/order/operations/queueNewOrderAutomation";
import { transformTicketsFromOrder } from "@/domain/order/transformers/transformTicketsFromOrder";
import { updateOrderStatusPaid, updateOrderStatusById } from "@/domain/order/operations/updateOrderStatus";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { subscribeOrderToNewsletter } from "@/domain/newsletter/operations/subscribeOrderToNewsletter";
import { queueTicketIssueAutomation } from "@/domain/ticket/operations/queueTicketIssueAutomation";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { createTransaction } from "@/domain/wallet/operations/createTransaction";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory, ProductType } from "@/domain/product/types/product";
import { OrderStatus } from "@prisma/client";

export const onOrderPaymentComplete = async (paymentSessionId: string) => {
  let order = await updateOrderStatusPaid(paymentSessionId);
  const items = order.items as unknown as ProductInOrder[];

  // Check if order has any physical items
  const hasPhysicalItems = items.some(item => item.type === ProductType.PHYSICAL);

  // Digital-only orders go straight to COMPLETED
  if (!hasPhysicalItems) {
    order = await updateOrderStatusById(order.id, OrderStatus.COMPLETED);
  }

  // Process wallet transactions (non-blocking)
  if (order.userId) {
    try {
      const wallet = await getWalletByUserId(order.userId);
      if (!wallet) {
        console.error("User has no wallet:", order.userId);
      } else {

        // Deduct wallet credit if used for purchase
        if (order.walletAmountUsed > 0) {
          await createTransaction({
            walletId: wallet.id,
            type: "PURCHASE",
            amount: -order.walletAmountUsed,
            note: `Order #${order.id}`,
          });
        }

        // Credit wallet for currency product purchases
        const currencyTotal = items
          .filter(item => item.category === ProductCategory.CURRENCIES)
          .reduce(
            (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
            0
          );

        if (currencyTotal > 0) {
          await createTransaction({
            walletId: wallet.id,
            type: "CREDIT",
            amount: currencyTotal,
            note: `Wallet top-up from Order #${order.id}`,
          });
        }

        // Credit wallet for top-up rewards from products
        const rewardTotal = items
          .filter(item => item.walletTopupReward && item.walletTopupReward > 0)
          .reduce(
            (sum, item) =>
              sum + Math.round(item.walletTopupReward! * 100) * item.quantity,
            0
          );

        if (rewardTotal > 0) {
          await createTransaction({
            walletId: wallet.id,
            type: "CREDIT",
            amount: rewardTotal,
            note: `Top up reward from Order #${order.id}`,
          });
        }
      }
    } catch (error) {
      console.error("Failed to process wallet transactions:", error);
      // Continue with order processing even if wallet transactions fail
    }
  }

  await queueNewOrderAutomation({ orderId: order.id });

  // Transform and process ticket items
  const ticketItems = transformTicketsFromOrder(order);

  // Collect event IDs from ticket items for newsletter subscription
  const ticketEventIds: string[] = [];

  if (ticketItems) {
    for (const ticketItem of ticketItems) {
      const ticketHolders = ticketItem.metadata?.ticketHolders as string[];
      const relatedEvent = ticketItem.relatedEvent;

      if (!relatedEvent) {
        console.error("Missing related event for ticket item", {
          paymentSessionId,
          ticketItem,
        });
        continue;
      }

      // Collect event ID for newsletter subscription
      ticketEventIds.push(relatedEvent);

      const eventData = await fetchEventFromCmsById(relatedEvent);
      if (!ticketHolders || !eventData) {
        console.error("Missing ticket holders or event data", {
          paymentSessionId,
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
          ticketPayerEmail: order.email,
          price: pricePerTicket,
          orderId: order.id,
          metadata: {
            productName: ticketItem.name ?? "Default",
            eventUid: eventData.uid,
          },
        });
      });
    }
  }

  // Subscribe to newsletter with tags based on order items
  // This handles: category-based tags, festival tags, Events/LastEvent fields
  await subscribeOrderToNewsletter(order.email, items, ticketEventIds, order.name);

  return order;
};
