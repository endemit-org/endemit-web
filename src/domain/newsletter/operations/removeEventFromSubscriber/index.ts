import "server-only";

import { getSubscriberFromList } from "@/domain/newsletter/actions/getSubscriberFromList";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";
import { EMAIL_NEWSLETTER_GENERAL_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";

/**
 * Removes one event name from a subscriber's Events field (ticket
 * transferred away with no remaining tickets). LastEvent and everything
 * else stay untouched; missing subscribers are a no-op.
 */
export async function removeEventFromSubscriber(
  email: string,
  eventName: string
): Promise<void> {
  const listId = EMAIL_NEWSLETTER_GENERAL_LIST_ID;
  const result = await getSubscriberFromList(email, listId);
  if (!result.exists || !result.subscriber) return;

  const existing = result.subscriber.fields?.Events;
  if (typeof existing !== "string" || existing.trim() === "") return;

  const remaining = existing
    .split(",")
    .map(entry => entry.trim())
    .filter(entry => entry && entry !== eventName)
    .join(",");
  if (remaining === existing) return;

  await subscribeEmailToList(email, listId, {
    fields: { Events: remaining },
  });
}
