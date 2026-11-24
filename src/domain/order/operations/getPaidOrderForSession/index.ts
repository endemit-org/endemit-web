import "server-only";

import { OrderStatus } from "@prisma/client";
import { getOrderById } from "@/domain/order/operations/getOrderById";
import { getOrderByStripeSession } from "@/domain/order/operations/getOrderByStripeSession";
import { stripe } from "@/lib/services/stripe";

/**
 * The paid order behind a success-page id, or null when it is not paid.
 * The id is a Checkout Session (cs_), a PaymentIntent (pi_) or, for orders
 * paid in full from the Wallet, the order id itself.
 */
export async function getPaidOrderForSession(sessionId: string) {
  if (sessionId.startsWith("cs_")) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status !== "complete") return null;
    return await getOrderByStripeSession(sessionId);
  }

  if (sessionId.startsWith("pi_")) {
    const paymentIntent = await stripe.paymentIntents.retrieve(sessionId);
    if (paymentIntent.status !== "succeeded") return null;
    // The order stores the PaymentIntent id in its stripeSession field.
    return await getOrderByStripeSession(sessionId);
  }

  const order = await getOrderById(sessionId);
  return order && order.status === OrderStatus.PAID ? order : null;
}
