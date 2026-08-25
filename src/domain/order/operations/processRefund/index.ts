import "server-only";

import { OrderStatus, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import { stripe } from "@/lib/services/stripe";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";
import {
  calculateRefundLimit,
  calculateRefundSplit,
  RefundItemSelection,
} from "@/domain/order/operations/calculateRefundLimit";
import { broadcastToUser } from "@/lib/services/supabase/broadcast";
import { bustOnTransactionCreated } from "@/lib/services/cache";
import { queueRefundEmailAutomation } from "@/domain/order/operations/runRefundEmailAutomation";
import { bustOnOrderRefunded, bustOnOrderStatusChanged } from "@/lib/services/cache";

export interface ProcessRefundInput {
  orderId: string;
  adminUserId: string;
  items: RefundItemSelection[];
  includeShipping?: boolean;
  reason?: string;
  sendEmail?: boolean;
}

export interface ProcessRefundResult {
  success: boolean;
  orderId: string;
  refundedAmount: number;
  walletRefundAmount: number;
  stripeRefundAmount: number;
  walletUnavailableAmount: number;
  stripeRefundId: string | null;
  newOrderStatus: OrderStatus;
  refundedItems: {
    itemIndex: number;
    itemName: string;
    quantity: number;
    amount: number;
  }[];
}

const REFUNDABLE_STATUSES: OrderStatus[] = [
  "PAID",
  "PREPARING",
  "COMPLETED",
  "REFUND_REQUESTED",
  "PARTIALLY_REFUNDED",
];

/**
 * Process a refund for selected items in an order.
 *
 * Flow:
 * 1. Validate order status
 * 2. Calculate refund limits (respecting wallet balance for CURRENCIES)
 * 3. Split the refund between wallet credit and Stripe, proportionally to how
 *    the order was paid (wallet-paid portion goes back as wallet credit,
 *    card-paid portion goes back through Stripe)
 * 4. Create Stripe refund for the card portion (if any)
 * 5. Update database (order, refunds, tickets, wallet credit-back)
 * 6. Optionally send email notification
 *
 * If the wallet portion cannot be returned (account deleted), the Stripe
 * portion is still refunded and the unreturnable amount is reported in the
 * result as walletUnavailableAmount.
 */
export async function processRefund(
  input: ProcessRefundInput
): Promise<ProcessRefundResult> {
  const { orderId, adminUserId, items, includeShipping, reason } = input;

  // 1. Fetch order with refunds
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      refunds: true,
      user: true,
      tickets: true,
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // 2. Validate status
  if (!REFUNDABLE_STATUSES.includes(order.status)) {
    throw new Error(
      `Cannot refund order in status: ${order.status}. ` +
        `Refundable statuses: ${REFUNDABLE_STATUSES.join(", ")}`
    );
  }

  // 3. Fetch wallet if user exists
  const wallet = order.userId
    ? await prisma.wallet.findUnique({ where: { userId: order.userId } })
    : null;

  // 4. Calculate refund limit
  const refundLimit = calculateRefundLimit({
    order,
    wallet,
    selectedItems: items,
    includeShipping,
  });

  if (refundLimit.maxRefundAmount <= 0) {
    throw new Error(
      "No refundable amount. " +
        (refundLimit.limitedBy === "wallet_balance"
          ? "Wallet balance is insufficient - credits have been spent."
          : "Items may have already been refunded.")
    );
  }

  // 5. Split the refund between wallet credit and Stripe, proportionally to
  // how the order was originally paid
  const totalOrderAmountCents = Math.round(Number(order.totalAmount) * 100);
  const split = calculateRefundSplit({
    refundAmount: refundLimit.maxRefundAmount,
    totalOrderAmount: totalOrderAmountCents,
    walletAmountUsed: order.walletAmountUsed,
    refundedAmount: order.refundedAmount,
    walletRefundedAmount: order.walletRefundedAmount,
    hasWallet: !!wallet,
  });

  if (split.walletAmount + split.stripeAmount <= 0) {
    throw new Error(
      split.walletUnavailableAmount > 0
        ? "This order was paid with wallet credit, but the customer's wallet no longer exists. The refund must be handled manually."
        : "No refundable amount remaining."
    );
  }

  // 6. Create Stripe refund for the card-paid portion (if any)
  let stripeRefundId: string | null = null;

  if (split.stripeAmount > 0) {
    try {
      let paymentIntentId: string | null = null;

      // Check if stripeSession is a payment intent ID (pi_) or checkout session ID (cs_)
      if (order.stripeSession.startsWith("pi_")) {
        // Direct payment intent
        paymentIntentId = order.stripeSession;
      } else if (order.stripeSession.startsWith("cs_")) {
        // Checkout session - retrieve to get payment intent
        const session = await stripe.checkout.sessions.retrieve(order.stripeSession);
        paymentIntentId = session.payment_intent as string | null;
      } else if (!order.stripeSession.startsWith("wallet_")) {
        // Try as checkout session (legacy)
        const session = await stripe.checkout.sessions.retrieve(order.stripeSession);
        paymentIntentId = session.payment_intent as string | null;
      }

      if (paymentIntentId) {
        // Create Stripe refund
        const stripeRefund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: split.stripeAmount,
          reason: "requested_by_customer",
          metadata: {
            orderId: order.id,
            adminUserId,
            itemCount: items.length.toString(),
          },
        });
        stripeRefundId = stripeRefund.id;
      } else {
        throw new Error("No payment intent found for this order");
      }
    } catch (error) {
      // If Stripe refund fails, don't proceed
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Stripe refund failed: ${message}`);
    }
  }

  // 7. Update database in transaction
  const orderItems = order.items as unknown as ProductInOrder[];
  const actualRefundedNow = split.walletAmount + split.stripeAmount;
  const newTotalRefunded = order.refundedAmount + actualRefundedNow;
  const isFullRefund = newTotalRefunded >= totalOrderAmountCents;

  const result = await prisma.$transaction(async (tx) => {
    // Create refund records for each item
    const refundRecords = await Promise.all(
      refundLimit.itemBreakdown
        .filter((b) => b.maxRefundableAmount > 0)
        .map((breakdown) =>
          tx.orderRefund.create({
            data: {
              orderId,
              itemIndex: breakdown.itemIndex,
              quantity: breakdown.maxRefundableQuantity,
              amount: breakdown.maxRefundableAmount,
              stripeRefundId,
              reason,
              createdById: adminUserId,
            },
          })
        )
    );

    // Create refund record for shipping if included (itemIndex = -1)
    if (refundLimit.shippingRefundable > 0) {
      await tx.orderRefund.create({
        data: {
          orderId,
          itemIndex: -1, // Special index for shipping
          quantity: 1,
          amount: refundLimit.shippingRefundable,
          stripeRefundId,
          reason: reason ? `${reason} (shipping)` : "Shipping refund",
          createdById: adminUserId,
        },
      });
    }

    // Determine new order status
    const newStatus: OrderStatus = isFullRefund
      ? "REFUNDED"
      : "PARTIALLY_REFUNDED";

    // Update order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        refundedAmount: newTotalRefunded,
        walletRefundedAmount: { increment: split.walletAmount },
        refundedAt: new Date(),
        refundedBy: adminUserId,
        refundReason: reason,
        stripeRefundId,
      },
    });

    // Credit the wallet-paid portion back as wallet credit
    let walletCreditTransactionId: string | null = null;
    if (split.walletAmount > 0 && wallet) {
      const creditedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: split.walletAmount } },
      });

      const walletCreditTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: split.walletAmount,
          balanceAfter: creditedWallet.balance,
          note: `Refund for order ${order.id.slice(-8)}`,
          createdById: adminUserId,
        },
      });
      walletCreditTransactionId = walletCreditTransaction.id;
    }

    // Update ticket statuses if any ticket items were refunded
    const ticketItemIndices = refundLimit.itemBreakdown
      .filter(
        (b) =>
          b.maxRefundableAmount > 0 &&
          orderItems[b.itemIndex]?.category === ProductCategory.TICKETS
      )
      .map((b) => b.itemIndex);

    if (ticketItemIndices.length > 0 && order.tickets.length > 0) {
      // For full refund, mark all tickets as refunded
      // For partial, this is more complex - would need to track which tickets
      // For now, mark all as refunded if any ticket items are refunded
      await tx.ticket.updateMany({
        where: {
          orderId,
          status: { notIn: [TicketStatus.REFUNDED] },
        },
        data: {
          status: TicketStatus.REFUNDED,
        },
      });
    }

    // Deduct from wallet if CURRENCIES items were refunded
    const currencyRefunds = refundLimit.itemBreakdown.filter(
      (b) =>
        b.maxRefundableAmount > 0 &&
        orderItems[b.itemIndex]?.category === ProductCategory.CURRENCIES
    );

    if (currencyRefunds.length > 0 && wallet) {
      const currencyRefundAmount = currencyRefunds.reduce(
        (sum, b) => sum + b.maxRefundableAmount,
        0
      );

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: currencyRefundAmount } },
      });

      // Create wallet transaction for the deduction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "REFUND",
          amount: -currencyRefundAmount,
          balanceAfter: updatedWallet.balance,
          note: `Refund for order ${order.id.slice(-8)}`,
          createdById: adminUserId,
        },
      });
    }

    return {
      order: updatedOrder,
      refunds: refundRecords,
      newStatus,
      walletCreditTransactionId,
    };
  });

  // Notify the customer's open sessions and bust wallet caches after the
  // wallet credit-back committed
  if (result.walletCreditTransactionId && order.userId && wallet) {
    const freshWallet = await prisma.wallet.findUnique({
      where: { id: wallet.id },
      select: { balance: true },
    });
    if (freshWallet) {
      broadcastToUser(order.userId, "balance_updated", {
        balance: freshWallet.balance,
      }).catch(err => {
        console.error("Failed to broadcast refund balance update:", err);
      });
    }
    await bustOnTransactionCreated(
      result.walletCreditTransactionId,
      order.userId,
      wallet.id
    );
  }

  // 7. Build refunded items for response
  const refundedItemsList = refundLimit.itemBreakdown
    .filter((b) => b.maxRefundableAmount > 0)
    .map((b) => ({
      itemIndex: b.itemIndex,
      itemName: b.itemName,
      quantity: b.maxRefundableQuantity,
      amount: b.maxRefundableAmount,
    }));

  // 8. Check if tickets were refunded
  const ticketItemIndicesForEmail = refundLimit.itemBreakdown
    .filter(
      (b) =>
        b.maxRefundableAmount > 0 &&
        orderItems[b.itemIndex]?.category === ProductCategory.TICKETS
    )
    .map((b) => b.itemIndex);

  const ticketsRefunded = ticketItemIndicesForEmail.length > 0 && order.tickets.length > 0;

  // 9. Queue refund email automation
  await queueRefundEmailAutomation({
    orderId: order.id,
    refundedAmount: actualRefundedNow,
    walletRefundAmount: split.walletAmount,
    stripeRefundAmount: split.stripeAmount,
    refundedItems: refundedItemsList,
    shippingRefunded: refundLimit.shippingRefundable > 0 ? refundLimit.shippingRefundable : undefined,
    ticketsRefunded,
  });

  // 10. Bust caches
  await bustOnOrderRefunded(order.id, order.userId);

  // 11. Return result
  return {
    success: true,
    orderId: order.id,
    refundedAmount: actualRefundedNow,
    walletRefundAmount: split.walletAmount,
    stripeRefundAmount: split.stripeAmount,
    walletUnavailableAmount: split.walletUnavailableAmount,
    stripeRefundId,
    newOrderStatus: result.newStatus,
    refundedItems: refundedItemsList,
  };
}

/**
 * Mark an order as refund requested without processing.
 * Used when admin wants to flag an order for later refund processing.
 */
export async function requestRefund(
  orderId: string,
  adminUserId: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const canRequestRefund: OrderStatus[] = [
    "PAID",
    "PREPARING",
    "COMPLETED",
    "PARTIALLY_REFUNDED",
  ];

  if (!canRequestRefund.includes(order.status)) {
    throw new Error(`Cannot request refund for order in status: ${order.status}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "REFUND_REQUESTED",
      metadata: {
        refundRequestedAt: new Date().toISOString(),
        refundRequestedBy: adminUserId,
      },
    },
  });

  await bustOnOrderStatusChanged(orderId, updatedOrder.userId);
}

/**
 * Cancel a refund request and restore the previous status.
 */
export async function cancelRefundRequest(
  orderId: string,
  restoreToStatus: OrderStatus
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "REFUND_REQUESTED") {
    throw new Error("Order is not in REFUND_REQUESTED status");
  }

  const validRestoreStatuses: OrderStatus[] = [
    "PAID",
    "PREPARING",
    "COMPLETED",
  ];

  if (!validRestoreStatuses.includes(restoreToStatus)) {
    throw new Error(`Cannot restore to status: ${restoreToStatus}`);
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: restoreToStatus },
  });

  await bustOnOrderStatusChanged(orderId, updatedOrder.userId);
}
