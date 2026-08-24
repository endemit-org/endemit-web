import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusPaid } from "@/domain/order/operations/updateOrderStatus";
import {
  OrderPaymentProcessingData,
  OrderQueueEvent,
} from "@/domain/order/types/order";

/**
 * Called from the Stripe webhook for `checkout.session.completed` and
 * `payment_intent.succeeded`. Kept deliberately tiny — Stripe redelivers the
 * event when the response is slow or non-2xx, so this only marks the order
 * PAID and hands every other side effect (emails, tickets, wallet, newsletter)
 * to the process-order-payment Inngest function.
 *
 * The Inngest event id makes redeliveries a no-op, while still re-arming
 * processing if an earlier delivery died between the status update and the
 * send. Re-sending on an already-PAID order is safe for the same reason, and
 * skipping the status update then also stops retries from downgrading a
 * digital order that already moved on to COMPLETED.
 */
export const onOrderPaymentComplete = async (paymentSessionId: string) => {
  const order = await prisma.order.findUnique({
    where: { stripeSession: paymentSessionId },
  });

  if (!order) {
    throw new Error(`Order not found for payment session: ${paymentSessionId}`);
  }

  const wasAlreadyPaid =
    order.status === OrderStatus.PAID ||
    order.status === OrderStatus.COMPLETED;

  const updatedOrder = wasAlreadyPaid
    ? order
    : await updateOrderStatusPaid(paymentSessionId);

  await inngest.send({
    id: `process-order-payment-${order.id}`,
    name: OrderQueueEvent.PROCESS_ORDER_PAYMENT,
    data: { orderId: order.id } satisfies OrderPaymentProcessingData,
  });

  return updatedOrder;
};
