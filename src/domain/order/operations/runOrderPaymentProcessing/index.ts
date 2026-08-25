import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { OrderStatus, WalletTransactionType } from "@prisma/client";
import {
  OrderPaymentProcessingData,
  OrderQueueEvent,
  ProductInOrder,
} from "@/domain/order/types/order";
import { TicketQueueEvent } from "@/domain/ticket/types/ticket";
import { NewsletterQueueEvent } from "@/domain/newsletter/types/newsletter";
import { transformTicketsFromOrder } from "@/domain/order/transformers/transformTicketsFromOrder";
import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { getWalletByUserIdFresh } from "@/domain/wallet/operations/getWalletByUserId";
import { createTransaction } from "@/domain/wallet/operations/createTransaction";
import { updateOrderStatusById } from "@/domain/order/operations/updateOrderStatus";
import { redeemDiscountCode } from "@/domain/discount/operations/redeemDiscountCode";
import { ProductCategory, ProductType } from "@/domain/product/types/product";
import {
  bustOnOrderCreated,
  bustOnDonationReceived,
} from "@/lib/services/cache";

/**
 * All post-payment side effects for an order, moved out of the Stripe webhook
 * so the webhook can respond within Stripe's delivery timeout (slow responses
 * caused Stripe to redeliver the event and duplicate every side effect).
 *
 * Idempotency layers:
 * - the sender uses event id `process-order-payment-<orderId>`, so redelivered
 *   webhooks dedupe at the Inngest ingest layer (24h window);
 * - `metadata.paymentProcessedAt` on the order makes deliveries outside that
 *   window a no-op;
 * - each side effect is individually idempotent (deterministic event ids on
 *   sendEvent, note-based existence checks on wallet transactions), so a run
 *   that crashes partway can safely retry and finish the remainder.
 */
export const runOrderPaymentProcessing = inngest.createFunction(
  {
    id: "process-order-payment-function",
    retries: 5,
    triggers: [{ event: OrderQueueEvent.PROCESS_ORDER_PAYMENT }],
  },
  async ({ event, step }) => {
    const { orderId } = event.data as OrderPaymentProcessingData;

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    const orderMetadata = (order.metadata ?? {}) as Record<string, unknown>;
    if (orderMetadata.paymentProcessedAt) {
      return { orderId, skipped: "already processed" };
    }

    const items = order.items as unknown as ProductInOrder[];

    // Count the discount code redemption (non-blocking, like the previous
    // inline flow — a failed counter must not hold up emails or tickets).
    await step.run("redeem-discount-code", async () => {
      if (!order.discountCodeId) return "no discount code";
      try {
        await redeemDiscountCode(order.discountCodeId);
        return order.discountCodeId;
      } catch (error) {
        console.error("Failed to redeem discount code:", error);
        return `failed: ${error}`;
      }
    });

    // Digital-only orders go straight to COMPLETED
    await step.run("complete-digital-order", async () => {
      const hasPhysicalItems = items.some(
        item => item.type === ProductType.PHYSICAL
      );
      if (hasPhysicalItems) return "has physical items";
      await updateOrderStatusById(order.id, OrderStatus.COMPLETED);
      return "completed";
    });

    await step.sendEvent("queue-new-order-notifications", {
      id: `notify-on-order-${order.id}`,
      name: OrderQueueEvent.NOTIFY_ON_ORDER,
      data: { orderId: order.id },
    });

    const preparedTickets = await step.run("prepare-ticket-issues", async () => {
      const ticketItems = transformTicketsFromOrder(order);
      const ticketEventIds: string[] = [];
      const events: Array<{
        id: string;
        name: string;
        data: Record<string, unknown>;
      }> = [];

      if (!ticketItems) return { events, ticketEventIds };

      for (const [lineIndex, ticketItem] of ticketItems.entries()) {
        const ticketHolders = ticketItem.metadata?.ticketHolders as string[];
        const relatedEvent = ticketItem.relatedEvent;

        if (!relatedEvent) {
          console.error("Missing related event for ticket item", {
            orderId: order.id,
            ticketItem,
          });
          continue;
        }

        ticketEventIds.push(relatedEvent);

        const eventData = await fetchEventFromCmsById(relatedEvent);
        if (!ticketHolders || !eventData) {
          console.error("Missing ticket holders or event data", {
            orderId: order.id,
            ticketHolders,
            eventData,
          });
          continue;
        }

        // Per-ticket price = line total / all holders on the line. Holders
        // number quantity × ticketQuantity, while price/paidPrice are per-unit
        // (paidPrice on discounted orders), so multiply by quantity first —
        // dividing the unit price alone halves the ticket price at quantity 2.
        const pricePerTicket =
          ((ticketItem.paidPrice ?? ticketItem.price) * ticketItem.quantity) /
          ticketHolders.length;

        ticketHolders.forEach((ticketHolderName, holderIndex) => {
          events.push({
            id: `create-ticket-${order.id}-${lineIndex}-${holderIndex}`,
            name: TicketQueueEvent.CREATE_TICKET,
            data: {
              eventId: eventData.id,
              eventName: eventData.name,
              ticketHolderName,
              ticketPayerEmail: order.email,
              price: pricePerTicket,
              orderId: order.id,
              locale: order.locale,
              metadata: {
                productName: ticketItem.name ?? "Default",
                eventUid: eventData.uid,
              },
            },
          });
        });
      }

      return { events, ticketEventIds };
    });

    if (preparedTickets.events.length > 0) {
      await step.sendEvent("queue-ticket-issues", preparedTickets.events);
    }

    // Queue newsletter subscription with tags based on order items
    await step.sendEvent("queue-order-newsletter", {
      id: `order-newsletter-${order.id}`,
      name: NewsletterQueueEvent.SUBSCRIBE_ORDER,
      data: {
        email: order.email,
        // Category-only projection: full items carry image placeholders that
        // can push the event past Inngest's 256KB limit.
        items: items.map(({ category }) => ({ category })),
        ticketEventIds: preparedTickets.ticketEventIds,
        customerName: order.name,
      },
    });

    // Wallet movements run after the notification/ticket queueing on purpose:
    // a permanently failing wallet step (e.g. insufficient balance) surfaces
    // as a failed Inngest run without holding the customer's email hostage.
    await step.run("process-wallet-transactions", async () => {
      if (!order.userId) return "no user on order";

      const wallet = await getWalletByUserIdFresh(order.userId);
      if (!wallet) {
        console.error("User has no wallet:", order.userId);
        return "no wallet";
      }

      // Notes are deterministic per order, so an existing transaction with
      // the same note means this movement already happened (an earlier
      // delivery or the inline wallet-payment path) — skip, don't repeat.
      const applied: string[] = [];
      const applyOnce = async (
        type: WalletTransactionType,
        amount: number,
        note: string
      ) => {
        const existing = await prisma.walletTransaction.findFirst({
          where: { walletId: wallet.id, type, note },
        });
        if (existing) {
          applied.push(`skipped (exists): ${note}`);
          return;
        }
        await createTransaction({ walletId: wallet.id, type, amount, note });
        applied.push(note);
      };

      if (order.walletAmountUsed > 0) {
        await applyOnce(
          "PURCHASE",
          -order.walletAmountUsed,
          `Order #${order.id}`
        );
      }

      const currencyTotal = items
        .filter(item => item.category === ProductCategory.CURRENCIES)
        .reduce(
          (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
          0
        );
      if (currencyTotal > 0) {
        await applyOnce(
          "CREDIT",
          currencyTotal,
          `Wallet top-up from Order #${order.id}`
        );
      }

      const rewardTotal = items
        .filter(item => item.walletTopupReward && item.walletTopupReward > 0)
        .reduce(
          (sum, item) =>
            sum + Math.round(item.walletTopupReward! * 100) * item.quantity,
          0
        );
      if (rewardTotal > 0) {
        await applyOnce(
          "CREDIT",
          rewardTotal,
          `Top up reward from Order #${order.id}`
        );
      }

      return applied;
    });

    await step.run("finalize", async () => {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          metadata: JSON.parse(
            JSON.stringify({
              ...orderMetadata,
              paymentProcessedAt: new Date().toISOString(),
            })
          ),
        },
      });

      await bustOnOrderCreated(order.id, order.userId);

      const hasDonations = items.some(
        item => item.category === ProductCategory.DONATIONS
      );
      if (hasDonations) {
        await bustOnDonationReceived();
      }
      return "finalized";
    });

    return { orderId: order.id };
  }
);
