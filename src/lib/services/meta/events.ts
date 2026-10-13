import {
  TrackedEvent,
  type TrackedEventData,
  type TrackedEventName,
} from "@/lib/services/tracking/events";

/**
 * Translation from our platform-agnostic vocabulary into Meta's standard
 * events, plus the shape of Meta's `custom_data`.
 *
 * Only standard event names are used: a custom name still appears in Events
 * Manager but cannot drive Meta's conversion optimization.
 */
const EVENT_NAMES: Record<TrackedEventName, string | null> = {
  [TrackedEvent.PAGE_VIEW]: "PageView",
  [TrackedEvent.VIEW_CONTENT]: "ViewContent",
  [TrackedEvent.ADD_TO_CART]: "AddToCart",
  [TrackedEvent.INITIATE_CHECKOUT]: "InitiateCheckout",
  [TrackedEvent.PURCHASE]: "Purchase",
  [TrackedEvent.LEAD]: "Lead",
  [TrackedEvent.COMPLETE_REGISTRATION]: "CompleteRegistration",
};

/** Meta's name for an event, or null when the platform has no equivalent. */
export function toMetaEventName(event: TrackedEventName): string | null {
  return EVENT_NAMES[event];
}

/** Line item as Meta expects it inside `custom_data.contents`. */
export interface MetaContent {
  id: string;
  quantity: number;
  item_price: number;
}

export interface MetaCustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_type?: "product" | "product_group";
  content_name?: string;
  content_category?: string;
  contents?: MetaContent[];
  num_items?: number;
  order_id?: string;
}

/**
 * Maps event data onto Meta's `custom_data`.
 *
 * Meta keeps the product name and category at the top level and the line
 * items in a parallel `contents` array keyed by `content_ids` — the inverse
 * of TikTok's nesting, which is why each platform owns this mapping.
 */
export function toMetaCustomData(
  data?: TrackedEventData
): MetaCustomData | undefined {
  if (!data) return undefined;

  const customData: MetaCustomData = {};

  if (data.currency) customData.currency = data.currency;
  if (data.value !== undefined) customData.value = data.value;
  if (data.contentName) customData.content_name = data.contentName;
  if (data.contentCategory) customData.content_category = data.contentCategory;
  if (data.numItems !== undefined) customData.num_items = data.numItems;
  if (data.orderId) customData.order_id = data.orderId;

  if (data.contents?.length) {
    customData.content_type = "product";
    customData.content_ids = data.contents.map(content => content.id);
    customData.contents = data.contents.map(content => ({
      id: content.id,
      quantity: content.quantity,
      item_price: content.unitPrice,
    }));
  }

  return Object.keys(customData).length > 0 ? customData : undefined;
}
