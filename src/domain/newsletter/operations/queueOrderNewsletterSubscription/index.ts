import "server-only";

import { inngest } from "@/lib/services/inngest";
import {
  NewsletterQueueEvent,
  OrderNewsletterSubscriptionData,
} from "@/domain/newsletter/types/newsletter";

export const queueOrderNewsletterSubscription = async (
  data: OrderNewsletterSubscriptionData
) => {
  return await inngest.send({
    name: NewsletterQueueEvent.SUBSCRIBE_ORDER,
    data: {
      ...data,
      // Callers pass full order items; keep only the category so image
      // placeholders and other bulk never hit Inngest's 256KB event limit.
      items: data.items.map(({ category }) => ({ category })),
    },
  });
};
