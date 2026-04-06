import { ProductInOrder } from "@/domain/order/types/order";

export enum NewsletterQueueEvent {
  SUBSCRIBE_ORDER = "newsletter/subscribe.order",
}

export interface OrderNewsletterSubscriptionData {
  email: string;
  items: ProductInOrder[];
  ticketEventIds?: string[];
  customerName?: string | null;
}
