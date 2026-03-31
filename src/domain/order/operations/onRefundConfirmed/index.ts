import "server-only";

import Stripe from "stripe";
import { prisma } from "@/lib/services/prisma";
import { stripe } from "@/lib/services/stripe";

/**
 * Handle Stripe charge.refunded webhook event.
 *
 * This confirms that Stripe has processed the refund.
 * The order was already updated when we initiated the refund,
 * so this is mainly for tracking/confirmation purposes.
 */
export async function onRefundConfirmed(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId = charge.payment_intent as string | null;

  if (!paymentIntentId) {
    console.log("Refund webhook: No payment intent ID, skipping");
    return;
  }

  try {
    // Find the checkout session for this payment intent
    const sessions = await stripe.checkout.sessions.list({
      payment_intent: paymentIntentId,
      limit: 1,
    });

    if (sessions.data.length === 0) {
      console.log("Refund webhook: No checkout session found for payment intent");
      return;
    }

    const sessionId = sessions.data[0].id;

    // Find order by stripe session
    const order = await prisma.order.findUnique({
      where: { stripeSession: sessionId },
    });

    if (!order) {
      console.log("Refund webhook: No order found for session", sessionId);
      return;
    }

    // Update order metadata to confirm Stripe processed the refund
    const existingMetadata = (order.metadata as Record<string, unknown>) ?? {};

    await prisma.order.update({
      where: { id: order.id },
      data: {
        metadata: {
          ...existingMetadata,
          stripeRefundConfirmed: true,
          stripeRefundConfirmedAt: new Date().toISOString(),
          stripeChargeId: charge.id,
          stripeRefundAmount: charge.amount_refunded,
        },
      },
    });

    console.log("Refund confirmed for order:", order.id, {
      chargeId: charge.id,
      amountRefunded: charge.amount_refunded,
    });
  } catch (error) {
    console.error("Error processing refund confirmation:", error);
    // Don't throw - webhook should still return 200
    // The refund was already processed, this is just confirmation
  }
}
