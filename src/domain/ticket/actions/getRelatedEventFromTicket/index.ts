import { ProductRelatedEvent } from "@/types/product";
import { CustomStripeLineItem } from "@/types/checkout";

export const getRelatedEventFromTicket = (item: CustomStripeLineItem) => {
  const metadata = item.price_data?.product_data?.metadata;

  if (!metadata || !metadata.relatedEvent) {
    return null;
  }

  return JSON.parse(metadata.relatedEvent) as ProductRelatedEvent;
};
