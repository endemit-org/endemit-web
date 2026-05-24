import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  NewsletterQueueEvent,
  OrderNewsletterSubscriptionData,
} from "@/domain/newsletter/types/newsletter";
import { subscribeOrderToNewsletter } from "@/domain/newsletter/operations/subscribeOrderToNewsletter";

/**
 * Inngest function to handle newsletter subscription for orders.
 *
 * This queued approach solves the race condition where:
 * 1. Checkout creates/updates a basic contact in Email Octopus
 * 2. Webhook tries to update the same contact with event data
 *
 * By using a queue with retries and initial delay, we ensure the contact
 * exists before trying to update it with order-specific data.
 */
export const runOrderNewsletterAutomation = inngest.createFunction(
  {
    id: "order-newsletter-subscription",
    retries: 5,
    triggers: [{ event: NewsletterQueueEvent.SUBSCRIBE_ORDER }],
  },
  async ({ event, step }) => {
    const { email, items, ticketEventIds, customerName } =
      event.data as OrderNewsletterSubscriptionData;

    const logPrefix = `[Inngest:OrderNewsletter:${email}]`;

    console.log(`${logPrefix} Function started`, {
      itemCount: items.length,
      ticketEventIds,
      hasCustomerName: !!customerName,
    });

    // Wait 2 seconds before first attempt to allow checkout subscription to complete
    await step.sleep("wait-for-contact-creation", "2s");

    console.log(`${logPrefix} Sleep completed, starting subscription`);

    const result = await step.run("subscribe-order-to-newsletter", async () => {
      console.log(`${logPrefix} Running subscription step`);

      const subscriptionResult = await subscribeOrderToNewsletter(
        email,
        items,
        ticketEventIds,
        customerName
      );

      console.log(`${logPrefix} Subscription step result`, {
        success: subscriptionResult.success,
        isNew: subscriptionResult.isNew,
      });

      if (!subscriptionResult.success) {
        // Throw error to trigger Inngest retry
        console.error(`${logPrefix} Subscription failed, will retry`);
        throw new Error(
          `Failed to subscribe order to newsletter for ${email}`
        );
      }

      return subscriptionResult;
    });

    console.log(`${logPrefix} Function completed successfully`, {
      isNew: result.isNew,
    });

    return {
      success: true,
      email,
      isNew: result.isNew,
    };
  }
);
