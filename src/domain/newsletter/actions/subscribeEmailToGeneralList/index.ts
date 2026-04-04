import { EMAIL_NEWSLETTER_GENERAL_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";
import { getSubscriberFromList } from "@/domain/newsletter/actions/getSubscriberFromList";
import { mergeEventsField } from "@/domain/newsletter/utils/determineSubscriberData";

interface SubscribeToGeneralListOptions {
  tags?: string[];
  eventName?: string;
}

/**
 * Subscribes an email to the general newsletter list.
 *
 * - If tags are provided, they are added to the subscriber
 * - If eventName is provided, it updates Events and LastEvent fields:
 *   - For new subscribers: Events = LastEvent = eventName
 *   - For existing subscribers: Events = existingEvents + eventName, LastEvent = eventName
 *
 * @param email - Email address to subscribe
 * @param options - Optional tags and event name
 */
export const subscribeEmailToGeneralList = async (
  email: string,
  options?: SubscribeToGeneralListOptions
) => {
  const listId = EMAIL_NEWSLETTER_GENERAL_LIST_ID;

  // If no event name, just subscribe with tags
  if (!options?.eventName) {
    return subscribeEmailToList(email, listId, {
      tags: options?.tags,
    });
  }

  // Fetch existing subscriber to get current Events field
  const existingSubscriber = await getSubscriberFromList(email, listId);

  let eventsField: string;
  if (existingSubscriber.exists && existingSubscriber.subscriber) {
    // Merge with existing Events
    const currentEvents = existingSubscriber.subscriber.fields?.Events;
    eventsField = mergeEventsField(currentEvents, options.eventName);
  } else {
    // New subscriber - Events = eventName
    eventsField = options.eventName;
  }

  return subscribeEmailToList(email, listId, {
    tags: options.tags,
    fields: {
      Events: eventsField,
      LastEvent: options.eventName,
    },
  });
};
