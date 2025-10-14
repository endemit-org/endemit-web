import { transformPriceToStripe } from "@/services/stripe/util";
import { isProductTicket } from "@/domain/product/businessLogic";
import { CartItem } from "@/types/cart";
import { ComplementaryTicketField } from "@/types/checkout";

export const createProductLineItems = (
  items: CartItem[],
  complementaryTicketData: ComplementaryTicketField
) => {
  return items.map(item => {
    const isTicket = isProductTicket(item);
    let ticketHolders: string[] = [];

    if (isTicket) {
      ticketHolders = Array.from(
        { length: item.quantity },
        (_, index) => `ticket-${item.id}-${index + 1}-name`
      ).map(key => complementaryTicketData[key]);
    }

    return {
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          description: item.checkoutDescription
            ? `${item.checkoutDescription}${isTicket ? ` (${ticketHolders.join(", ")})` : ""}`
            : undefined,
          images: item.images.length > 0 ? [item.images[0].src] : undefined,
          metadata: {
            productType: item.type,
            productCategory: item.category,
            ticketHolders: isTicket ? JSON.stringify(ticketHolders) : null,
            relatedEvent: item.relatedEvent
              ? JSON.stringify(item.relatedEvent)
              : null,
            uid: item.uid,
          },
        },
        unit_amount: transformPriceToStripe(item.price),
      },
      quantity: item.quantity,
    };
  });
};
