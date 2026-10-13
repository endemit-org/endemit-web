import {
  TrackedEvent,
  type TrackedEventData,
  type TrackedEventName,
} from "@/lib/services/tracking/events";

/**
 * Translation from our platform-agnostic vocabulary into TikTok's standard
 * web events.
 *
 * Only official names are accepted: TikTok does not map custom event names to
 * its optimization objectives, so a typo produces an event that exists in
 * reporting but is useless for campaign delivery.
 *
 * Notable differences from Meta: a purchase is `CompletePayment` (TikTok's
 * `PlaceAnOrder` is order placement before payment, which our flow does not
 * report separately), and a newsletter signup maps to `SubmitForm`.
 */
const EVENT_NAMES: Record<TrackedEventName, string | null> = {
  [TrackedEvent.PAGE_VIEW]: "Pageview",
  [TrackedEvent.VIEW_CONTENT]: "ViewContent",
  [TrackedEvent.ADD_TO_CART]: "AddToCart",
  [TrackedEvent.INITIATE_CHECKOUT]: "InitiateCheckout",
  [TrackedEvent.PURCHASE]: "CompletePayment",
  [TrackedEvent.LEAD]: "SubmitForm",
  [TrackedEvent.COMPLETE_REGISTRATION]: "CompleteRegistration",
};

/** TikTok's name for an event, or null when the platform has no equivalent. */
export function toTikTokEventName(event: TrackedEventName): string | null {
  return EVENT_NAMES[event];
}

/** One line item in TikTok's `properties.contents`. */
export interface TikTokContent {
  content_id: string;
  content_type: "product";
  content_name?: string;
  content_category?: string;
  quantity: number;
  price: number;
}

export interface TikTokProperties {
  currency?: string;
  value?: number;
  content_type?: "product";
  contents?: TikTokContent[];
  description?: string;
  order_id?: string;
}

/**
 * Maps event data onto TikTok's `properties` object.
 *
 * TikTok carries the product name and category inside each `contents` entry
 * rather than at the top level as Meta does, so single-product events fold
 * `contentName`/`contentCategory` into the one line they describe.
 */
export function toTikTokProperties(
  data?: TrackedEventData
): TikTokProperties | undefined {
  if (!data) return undefined;

  const properties: TikTokProperties = {};

  if (data.currency) properties.currency = data.currency;
  if (data.value !== undefined) properties.value = data.value;
  if (data.orderId) properties.order_id = data.orderId;

  if (data.contents?.length) {
    properties.content_type = "product";
    properties.contents = data.contents.map(content => {
      const entry: TikTokContent = {
        content_id: content.id,
        content_type: "product",
        quantity: content.quantity,
        price: content.unitPrice,
      };
      const name = content.name ?? data.contentName;
      const category = content.category ?? data.contentCategory;
      if (name) entry.content_name = name;
      if (category) entry.content_category = category;
      return entry;
    });
  } else if (data.contentName) {
    // An event that names a product but carries no line items (ViewContent).
    properties.description = data.contentName;
  }

  return Object.keys(properties).length > 0 ? properties : undefined;
}
