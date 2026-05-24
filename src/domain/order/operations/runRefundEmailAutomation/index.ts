import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { OrderQueueEvent, RefundNotificationData } from "@/domain/order/types/order";
import { sendRefundConfirmationEmail } from "@/domain/email/operations/sendRefundConfirmationEmail";
import { sendTicketInvalidationEmail } from "@/domain/email/operations/sendTicketInvalidationEmail";
import { stripe } from "@/lib/services/stripe";
import type { InvalidatedTicket } from "@/domain/email/templates/TicketInvalidation";

/**
 * Inngest automation to send refund notification emails.
 *
 * Step 1: Send refund confirmation email to order email (with full details)
 * Step 2: Send ticket invalidation email to ticket holders (if tickets were refunded)
 */
export const runRefundEmailAutomation = inngest.createFunction(
  {
    id: "refund-email-automation",
    retries: 5,
    triggers: [{ event: OrderQueueEvent.NOTIFY_ON_REFUND }],
  },
  async ({ event, step }) => {
    const {
      orderId,
      refundedAmount,
      refundedItems,
      shippingRefunded,
      ticketsRefunded,
    } = event.data as RefundNotificationData;

    // Fetch order with tickets
    const order = await step.run("fetch-order", async () => {
      return await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          tickets: {
            where: { status: "REFUNDED" },
            select: {
              shortId: true,
              eventName: true,
              ticketHolderName: true,
              ticketPayerEmail: true,
            },
          },
        },
      });
    });

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Try to get payment method hint from Stripe
    const paymentMethodHint = await step.run("get-payment-method", async () => {
      try {
        let paymentIntentId: string | null = null;

        if (order.stripeSession.startsWith("pi_")) {
          paymentIntentId = order.stripeSession;
        } else if (order.stripeSession.startsWith("cs_")) {
          const session = await stripe.checkout.sessions.retrieve(order.stripeSession);
          paymentIntentId = session.payment_intent as string | null;
        }

        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          if (paymentIntent.payment_method && typeof paymentIntent.payment_method === "string") {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
            if (paymentMethod.card) {
              const brand = paymentMethod.card.brand?.charAt(0).toUpperCase() + paymentMethod.card.brand?.slice(1);
              return `${brand} ending in ${paymentMethod.card.last4}`;
            }
          }
        }
        return null;
      } catch (error) {
        console.error("Failed to get payment method:", error);
        return null;
      }
    });

    // Step 1: Send refund confirmation email to order email
    await step.run("send-refund-confirmation-email", async () => {
      const result = await sendRefundConfirmationEmail({
        orderId: order.id,
        orderEmail: order.email,
        refundedAmount,
        refundedItems: refundedItems.map((item) => ({
          itemName: item.itemName,
          quantity: item.quantity,
          amount: item.amount,
        })),
        orderDate: order.createdAt,
        paymentMethodHint: paymentMethodHint ?? undefined,
        shippingRefunded,
      });

      if (result?.error) {
        throw new Error(`Failed to send refund confirmation email: ${result.error}`);
      }

      return { sent: true, email: order.email };
    });

    // Step 2: Send ticket invalidation emails if tickets were refunded
    if (ticketsRefunded && order.tickets.length > 0) {
      await step.run("send-ticket-invalidation-emails", async () => {
        // Group tickets by email
        const ticketsByEmail = new Map<string, InvalidatedTicket[]>();

        for (const ticket of order.tickets) {
          const email = ticket.ticketPayerEmail;
          if (!ticketsByEmail.has(email)) {
            ticketsByEmail.set(email, []);
          }
          ticketsByEmail.get(email)!.push({
            shortId: ticket.shortId,
            eventName: ticket.eventName,
            ticketHolderName: ticket.ticketHolderName,
          });
        }

        // Send one email per unique email address
        const results: { email: string; ticketCount: number; sent: boolean }[] = [];

        for (const [email, tickets] of ticketsByEmail) {
          const result = await sendTicketInvalidationEmail({
            email,
            tickets,
            orderId: order.id,
          });

          results.push({
            email,
            ticketCount: tickets.length,
            sent: !result?.error,
          });
        }

        return results;
      });
    }

    return {
      orderId: order.id,
      refundedAmount,
      emailsSent: true,
      ticketsInvalidated: ticketsRefunded ? order.tickets.length : 0,
    };
  }
);

/**
 * Queue the refund email automation.
 */
export const queueRefundEmailAutomation = async (data: RefundNotificationData) => {
  await inngest.send({
    name: OrderQueueEvent.NOTIFY_ON_REFUND,
    data,
  });
};
