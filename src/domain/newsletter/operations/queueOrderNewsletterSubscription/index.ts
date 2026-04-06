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
    data,
  });
};
