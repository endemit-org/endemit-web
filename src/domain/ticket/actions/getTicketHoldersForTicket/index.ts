import { CustomStripeLineItem } from "@/types/checkout";

export const getTicketHoldersForTicket = (
  item: CustomStripeLineItem,
  ticketPayerEmail: string
) => {
  const metadata = item.price_data?.product_data?.metadata;
  const quantity = item.quantity || 1;

  if (!metadata?.relatedEvent) {
    console.warn("No related event found in product metadata for item:", item);
    return;
  }

  if (!metadata?.ticketHolders) {
    console.warn("No ticket holders were found for item", item);
    return;
  }

  const ticketHolders = metadata?.ticketHolders
    ? (JSON.parse(metadata.ticketHolders) as string[])
    : Array.from({ length: quantity }, () => ticketPayerEmail);

  return ticketHolders;
};
