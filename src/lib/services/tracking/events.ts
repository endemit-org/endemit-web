/**
 * Platform-agnostic advertising event vocabulary.
 *
 * Call sites describe *what the customer did* in these terms and never name a
 * platform. Each ad platform module translates them into its own event names
 * (Meta's `Purchase` is TikTok's `CompletePayment`, and so on), so adding a
 * platform touches the platform module and nothing else.
 */

export const TrackedEvent = {
  PAGE_VIEW: "page_view",
  VIEW_CONTENT: "view_content",
  ADD_TO_CART: "add_to_cart",
  INITIATE_CHECKOUT: "initiate_checkout",
  PURCHASE: "purchase",
  LEAD: "lead",
  COMPLETE_REGISTRATION: "complete_registration",
} as const;

export type TrackedEventName =
  (typeof TrackedEvent)[keyof typeof TrackedEvent];

export const TRACKING_CURRENCY = "EUR";

/** One cart or order line. */
export interface TrackedContent {
  /** Product uid — the same id across every platform and every event. */
  id: string;
  quantity: number;
  unitPrice: number;
  name?: string;
  category?: string;
}

/** Commercial detail of an event. Every field is optional per event type. */
export interface TrackedEventData {
  currency?: string;
  /** Monetary value of the event, in `currency`. */
  value?: number;
  contents?: TrackedContent[];
  /** Single-product events (ViewContent) may name the product directly. */
  contentName?: string;
  contentCategory?: string;
  numItems?: number;
  orderId?: string;
}

/**
 * Deduplication key for a purchase, shared by the browser and the server.
 *
 * Both Meta and TikTok keep the first event they see for a given
 * (pixel, event name, event id) and discard the duplicate — Meta over 48
 * hours, TikTok likewise. Deriving the id from the order id means the browser
 * event fired on the success page and the server event fired from the payment
 * job collapse into one conversion, with no shared state between them.
 */
export function purchaseEventId(orderId: string): string {
  return `purchase-${orderId}`;
}

/** Convenience: total units across lines. */
export function countItems(contents: TrackedContent[]): number {
  return contents.reduce((sum, content) => sum + content.quantity, 0);
}
