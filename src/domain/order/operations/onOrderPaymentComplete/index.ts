import "server-only";

import { queueNewOrderAutomation } from "@/domain/order/operations/queueNewOrderAutomation";
import { transformTicketsFromOrder } from "@/domain/order/transformers/transformTicketsFromOrder";
import { updateOrderStatusPaid } from "@/domain/order/operations/updateOrderStatus";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { subscribeEmailToTicketBuyerList } from "@/domain/newsletter/actions/subscribeEmailToTicketBuyerList";
import { notifyOnNewSubscriber } from "@/domain/notification/operations/notifyOnNewSubscriber";
import { queueTicketIssueAutomation } from "@/domain/ticket/operations/queueTicketIssueAutomation";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { createWallet } from "@/domain/wallet/operations/createWallet";
import { createTransaction } from "@/domain/wallet/operations/createTransaction";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";

export const onOrderPaymentComplete = async (paymentSessionId: string) => {
  const order = await updateOrderStatusPaid(paymentSessionId);

  // Process wallet transaction if wallet credit was used (non-blocking)
  if (order.walletAmountUsed > 0 && order.userId) {
    try {
      const wallet = await getWalletByUserId(order.userId);
      if (wallet) {
        await createTransaction({
          walletId: wallet.id,
          type: "PURCHASE",
          amount: -order.walletAmountUsed, // Negative for PURCHASE
          note: `Order #${order.id}`,
        });
      }
    } catch (error) {
      console.error("Failed to process wallet transaction:", error);
      // Continue with order processing even if wallet transaction fails
    }
  }

  // Process currency product purchases (wallet top-ups)
  if (order.userId) {
    try {
      const items = order.items as unknown as ProductInOrder[];
      const currencyTotal = items
        .filter(item => item.category === ProductCategory.CURRENCIES)
        .reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);

      if (currencyTotal > 0) {
        let walletId: string | null = null;
        const existingWallet = await getWalletByUserId(order.userId);

        if (existingWallet) {
          walletId = existingWallet.id;
        } else {
          // Create wallet if user doesn't have one
          const newWallet = await createWallet(order.userId);
          walletId = newWallet.id;
        }

        await createTransaction({
          walletId,
          type: "CREDIT",
          amount: currencyTotal, // Positive for CREDIT (in cents)
          note: `Wallet top-up from Order #${order.id}`,
        });
      }
    } catch (error) {
      console.error("Failed to process currency top-up:", error);
      // Continue with order processing even if top-up fails
    }
  }

  await queueNewOrderAutomation({ orderId: order.id });
  const ticketItems = transformTicketsFromOrder(order);

  if (ticketItems) {
    for (const ticketItem of ticketItems) {
      const ticketHolders = ticketItem.metadata?.ticketHolders as string[];
      const relatedEvent = ticketItem.relatedEvent;

      if (!relatedEvent) {
        console.error("Missing related event for ticket item", {
          paymentSessionId,
          ticketItem,
        });
        return;
      }

      const eventData = await fetchEventFromCmsById(relatedEvent);
      if (!ticketHolders || !eventData) {
        console.error("Missing ticket holders or event data", {
          paymentSessionId,
          ticketHolders,
          eventData,
        });
        return;
      }

      const subscriptionResponse = await subscribeEmailToTicketBuyerList(
        order.email,
        eventData.uid
      );
      if (subscriptionResponse) {
        await notifyOnNewSubscriber(order.email, "Ticket buyers Newsletter");
      }

      ticketHolders.forEach(ticketHolderName => {
        queueTicketIssueAutomation({
          eventId: eventData.id,
          eventName: eventData.name,
          ticketHolderName,
          ticketPayerEmail: order.email,
          price: ticketItem.price,
          orderId: order.id,
          metadata: {
            productName: ticketItem.name ?? "Default",
            eventUid: eventData.uid,
          },
        });
      });
    }
  }

  return order;
};
