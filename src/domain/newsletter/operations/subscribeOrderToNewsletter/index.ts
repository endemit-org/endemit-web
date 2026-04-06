import "server-only";

import { fetchEventFromCmsById } from "@/domain/cms/operations/fetchEventFromCms";
import { subscribeEmailToList } from "@/domain/newsletter/actions/subscribeEmailToList";
import { getSubscriberFromList } from "@/domain/newsletter/actions/getSubscriberFromList";
import { EMAIL_NEWSLETTER_GENERAL_LIST_ID } from "@/lib/services/emailOctopus/emailOctopus";
import { notifyOnSubscriberUpdated } from "@/domain/notification/operations/notifyOnSubscriberUpdated";
import {
  determineSubscriberData,
  mergeEventsField,
} from "@/domain/newsletter/utils/determineSubscriberData";
import { ProductInOrder } from "@/domain/order/types/order";
import { EventType } from "@/domain/event/types/event";

interface EventData {
  name: string;
  type: EventType;
  date_start: Date | null;
}

/**
 * Parses a full name into first and last name components.
 * Assumes format "FirstName LastName" or "FirstName MiddleName LastName"
 */
function parseFullName(fullName: string): { firstName: string; lastName: string } | null {
  const trimmed = fullName.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  // First part is first name, rest is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

/**
 * Subscribes an order's email to the newsletter with appropriate tags and event data.
 *
 * Tags are determined by product categories:
 * - Tickets → "Ticket buyer"
 * - Currencies → "Currency buyer"
 * - Donations → "Donor"
 * - Other → "Merch buyer"
 *
 * Additional tags:
 * - If any ticket is for a festival event → "Festival {YEAR}"
 *
 * Events/LastEvent fields are updated for ticket purchases.
 * FirstName/LastName fields are updated if customer name is provided.
 *
 * @param email - Customer email address
 * @param items - Order items with category info
 * @param ticketEventIds - Related event IDs from ticket items (optional)
 * @param customerName - Full name from shipping form (optional)
 */
export async function subscribeOrderToNewsletter(
  email: string,
  items: ProductInOrder[],
  ticketEventIds?: string[],
  customerName?: string | null
): Promise<{ success: boolean; isNew?: boolean }> {
  const logPrefix = `[OrderNewsletter:${email}]`;
  const listId = EMAIL_NEWSLETTER_GENERAL_LIST_ID;

  console.log(`${logPrefix} Starting order newsletter subscription`, {
    itemCount: items.length,
    ticketEventIds,
    customerName: customerName ? "[provided]" : "[none]",
    categories: [...new Set(items.map(i => i.category))],
  });

  // Fetch event data for all unique ticket events
  const uniqueEventIds = [...new Set(ticketEventIds?.filter(Boolean) ?? [])];
  const eventDataList: EventData[] = [];

  for (const eventId of uniqueEventIds) {
    const eventData = await fetchEventFromCmsById(eventId);
    if (eventData) {
      eventDataList.push({
        name: eventData.name,
        type: eventData.type,
        date_start: eventData.date_start,
      });
    }
  }

  console.log(`${logPrefix} Fetched event data`, {
    eventCount: eventDataList.length,
    events: eventDataList.map(e => ({ name: e.name, type: e.type })),
  });

  // Determine tags from order items
  const firstEventData = eventDataList[0];
  const subscriberData = determineSubscriberData(items, firstEventData);

  // Add festival tags for any additional festival events
  for (let i = 1; i < eventDataList.length; i++) {
    const eventData = eventDataList[i];
    if (eventData.type === EventType.Festival && eventData.date_start) {
      const year = new Date(eventData.date_start).getFullYear();
      const festivalTag = `Festival ${year}`;
      if (!subscriberData.tags.includes(festivalTag)) {
        subscriberData.tags.push(festivalTag);
      }
    }
  }

  console.log(`${logPrefix} Determined tags`, { tags: subscriberData.tags });

  // Check if subscriber already exists (for Events field merging and isNew tracking)
  const existingSubscriber = await getSubscriberFromList(email, listId);
  const wasExistingSubscriber = existingSubscriber.exists;

  console.log(`${logPrefix} Existing subscriber check`, {
    exists: wasExistingSubscriber,
    existingEvents: existingSubscriber.subscriber?.fields?.Events,
    existingLastEvent: existingSubscriber.subscriber?.fields?.LastEvent,
  });

  // Build fields object
  const fields: {
    FirstName?: string;
    LastName?: string;
    Events?: string;
    LastEvent?: string;
    EventCount?: number;
    LastEventDate?: string;
  } = {};

  // Add name fields if provided and not already set
  if (customerName) {
    const parsedName = parseFullName(customerName);
    if (parsedName) {
      // Only set name if not already set on existing subscriber
      const existingFirstName = existingSubscriber.subscriber?.fields?.FirstName;
      const existingLastName = existingSubscriber.subscriber?.fields?.LastName;

      if (!existingFirstName && parsedName.firstName) {
        fields.FirstName = parsedName.firstName;
      }
      if (!existingLastName && parsedName.lastName) {
        fields.LastName = parsedName.lastName;
      }
    }
  }

  // Add event fields if we have ticket events
  if (eventDataList.length > 0) {
    let eventsField = wasExistingSubscriber
      ? existingSubscriber.subscriber?.fields?.Events ?? ""
      : "";

    // Merge all new event names
    for (const eventData of eventDataList) {
      eventsField = mergeEventsField(eventsField || null, eventData.name);
    }

    // LastEvent is the last event in the list (most recently processed)
    const lastEventName = eventDataList[eventDataList.length - 1].name;

    fields.Events = eventsField;
    fields.LastEvent = lastEventName;

    // EventCount: count unique events from the merged Events field
    fields.EventCount = eventsField ? eventsField.split(",").length : 0;

    // LastEventDate: find the latest event date from current order
    const eventsWithDates = eventDataList.filter(e => e.date_start !== null);
    if (eventsWithDates.length > 0) {
      const latestEventDate = eventsWithDates
        .sort((a, b) => new Date(b.date_start!).getTime() - new Date(a.date_start!).getTime())[0]
        .date_start!;

      const latestDateStr = new Date(latestEventDate).toISOString().split("T")[0];

      // Compare with existing LastEventDate and use the later one
      const existingLastEventDate = existingSubscriber.subscriber?.fields?.LastEventDate;
      if (existingLastEventDate && existingLastEventDate > latestDateStr) {
        fields.LastEventDate = existingLastEventDate;
      } else {
        fields.LastEventDate = latestDateStr;
      }
    }
  }

  // Subscribe with tags and fields
  const hasFields = Object.keys(fields).length > 0;

  console.log(`${logPrefix} Prepared subscription data`, {
    tags: subscriberData.tags,
    fields,
    hasFields,
  });

  const result = await subscribeEmailToList(email, listId, {
    tags: subscriberData.tags.length > 0 ? subscriberData.tags : undefined,
    fields: hasFields ? fields : undefined,
  });

  // Notify on subscriber update (always when successful)
  const isNew = !wasExistingSubscriber;

  console.log(`${logPrefix} Subscription result`, {
    success: result.success,
    isNew,
    error: result.error,
  });

  if (result.success) {
    const lastEventName = eventDataList.length > 0
      ? eventDataList[eventDataList.length - 1].name
      : undefined;

    await notifyOnSubscriberUpdated({
      email,
      tags: subscriberData.tags,
      eventName: lastEventName,
      isNew,
    });
  }

  return {
    success: result.success,
    isNew,
  };
}
