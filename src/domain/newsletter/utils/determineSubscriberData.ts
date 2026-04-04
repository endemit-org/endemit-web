import { ProductCategory } from "@/domain/product/types/product";
import { EventType } from "@/domain/event/types/event";

// Tag constants
export const TAGS = {
  TICKET_BUYER: "Ticket buyer",
  CURRENCY_BUYER: "Currency buyer",
  MERCH_BUYER: "Merch buyer",
  DONOR: "Donor",
} as const;

interface OrderItemForTagging {
  category: ProductCategory;
}

interface EventDataForTagging {
  name: string;
  type: EventType;
  date_start: Date | null;
}

interface SubscriberData {
  tags: string[];
  eventName: string | null;
}

/**
 * Determines the category-based tag for a product
 */
function getTagForCategory(category: ProductCategory): string {
  switch (category) {
    case ProductCategory.TICKETS:
      return TAGS.TICKET_BUYER;
    case ProductCategory.CURRENCIES:
      return TAGS.CURRENCY_BUYER;
    case ProductCategory.DONATIONS:
      return TAGS.DONOR;
    default:
      return TAGS.MERCH_BUYER;
  }
}

/**
 * Generates the festival tag if applicable
 * Format: "Festival {YEAR}" e.g., "Festival 2026"
 */
function getFestivalTag(eventData: EventDataForTagging): string | null {
  if (eventData.type !== EventType.Festival) {
    return null;
  }

  if (!eventData.date_start) {
    return null;
  }

  const year = new Date(eventData.date_start).getFullYear();
  return `Festival ${year}`;
}

/**
 * Determines tags and event data for Email Octopus subscription
 * based on order items and associated event data.
 *
 * @param items - Order items with category information
 * @param eventData - Event data for ticket purchases (optional)
 * @returns Tags to add and event name for Events/LastEvent fields
 */
export function determineSubscriberData(
  items: OrderItemForTagging[],
  eventData?: EventDataForTagging
): SubscriberData {
  const tagsSet = new Set<string>();

  // Add category-based tags
  for (const item of items) {
    tagsSet.add(getTagForCategory(item.category));
  }

  // Add festival tag if applicable
  if (eventData) {
    const festivalTag = getFestivalTag(eventData);
    if (festivalTag) {
      tagsSet.add(festivalTag);
    }
  }

  return {
    tags: Array.from(tagsSet),
    eventName: eventData?.name ?? null,
  };
}

/**
 * Merges a new event name into an existing Events field value.
 * Format: comma-separated, no spaces after commas.
 *
 * @param existingEvents - Current Events field value (may be null/empty)
 * @param newEventName - New event name to add
 * @returns Updated Events field value
 */
export function mergeEventsField(
  existingEvents: string | null | undefined,
  newEventName: string
): string {
  if (!existingEvents || existingEvents.trim() === "") {
    return newEventName;
  }

  // Check if event already exists in the list
  const existingList = existingEvents.split(",");
  if (existingList.includes(newEventName)) {
    return existingEvents;
  }

  return `${existingEvents},${newEventName}`;
}
