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
 * @returns Result with success status and isNew flag indicating if this was a new subscriber
 */
export const subscribeEmailToGeneralList = async (
  email: string,
  options?: SubscribeToGeneralListOptions
): Promise<{ success: boolean; isNew: boolean; error?: string }> => {
  const logPrefix = `[GeneralList:${email}]`;
  const listId = EMAIL_NEWSLETTER_GENERAL_LIST_ID;

  console.log(`${logPrefix} Starting subscription`, {
    hasEventName: !!options?.eventName,
    tags: options?.tags,
  });

  // Check if subscriber already exists
  const existingSubscriber = await getSubscriberFromList(email, listId);
  const isNew = !existingSubscriber.exists;

  console.log(`${logPrefix} Subscriber status`, {
    isNew,
    existingEvents: existingSubscriber.subscriber?.fields?.Events,
  });

  // If no event name, just subscribe with tags
  if (!options?.eventName) {
    const result = await subscribeEmailToList(email, listId, {
      tags: options?.tags,
    });
    console.log(`${logPrefix} Basic subscription result`, {
      success: result.success,
      isNew,
    });
    return { ...result, isNew };
  }

  let eventsField: string;
  if (existingSubscriber.exists && existingSubscriber.subscriber) {
    // Merge with existing Events
    const currentEvents = existingSubscriber.subscriber.fields?.Events;
    eventsField = mergeEventsField(currentEvents, options.eventName);
  } else {
    // New subscriber - Events = eventName
    eventsField = options.eventName;
  }

  const result = await subscribeEmailToList(email, listId, {
    tags: options.tags,
    fields: {
      Events: eventsField,
      LastEvent: options.eventName,
    },
  });

  console.log(`${logPrefix} Subscription with event result`, {
    success: result.success,
    isNew,
    eventsField,
  });

  return { ...result, isNew };
};
