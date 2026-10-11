/**
 * Meta event vocabulary shared by the browser pixel and the Conversions API.
 *
 * Both sides must send the same `event_name` and the same `event_id` for the
 * same real-world action, otherwise Meta counts the conversion twice instead
 * of deduplicating it. Keeping the names and the id builders in one file is
 * what makes that guarantee hold.
 */

export const MetaEvent = {
  PAGE_VIEW: "PageView",
  VIEW_CONTENT: "ViewContent",
  ADD_TO_CART: "AddToCart",
  INITIATE_CHECKOUT: "InitiateCheckout",
  PURCHASE: "Purchase",
  LEAD: "Lead",
  COMPLETE_REGISTRATION: "CompleteRegistration",
} as const;

export type MetaEventName = (typeof MetaEvent)[keyof typeof MetaEvent];

export const META_CURRENCY = "EUR";

/**
 * Deterministic deduplication key for a purchase. The browser fires it from
 * the success page and the Inngest payment processing fires it from the
 * server; both derive it from the order id, so Meta sees one conversion.
 */
export function metaPurchaseEventId(orderId: string): string {
  return `purchase-${orderId}`;
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
