import { ProductCategory } from "@/domain/product/types/product";

export enum NewsletterQueueEvent {
  SUBSCRIBE_ORDER = "newsletter/subscribe.order",
}

/**
 * Slim order-item projection carried in the SUBSCRIBE_ORDER Inngest event.
 * The newsletter automation only tags by category — never send full
 * ProductInOrder items here: their image placeholders can be hundreds of KB
 * and Inngest rejects events over 256KB.
 */
export interface NewsletterOrderItem {
  category: ProductCategory;
}

export interface OrderNewsletterSubscriptionData {
  email: string;
  items: NewsletterOrderItem[];
  ticketEventIds?: string[];
  customerName?: string | null;
}
