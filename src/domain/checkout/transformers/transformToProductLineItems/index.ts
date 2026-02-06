import { transformPriceToStripe } from "@/domain/checkout/transformers/transformPriceToStripe";
import {
  isProductTicket,
  getTicketQuantityForProduct,
} from "@/domain/product/businessLogic";
import { ComplementaryTicketField } from "@/domain/checkout/types/checkout";
import { getTicketHoldersFromData } from "@/domain/checkout/actions/getTicketHoldersFromData";
import { CartItem } from "@/domain/checkout/types/cartItem";

const transformToProductLineItems = (
  item: CartItem,
  complementaryTicketData: ComplementaryTicketField
) => {
  const isTicket = isProductTicket(item);
  let ticketHolders: string[] = [];
  let ticketQuantity = 1;

  if (isTicket) {
    ticketQuantity = getTicketQuantityForProduct(item);
    ticketHolders = getTicketHoldersFromData({
      complementaryTicketData,
      quantity: item.quantity,
      id: item.id,
      ticketQuantity,
    });
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
          ticketQuantity: isTicket ? String(ticketQuantity) : null,
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
};

export const createProductLineItems = (
  items: CartItem[],
  complementaryTicketData: ComplementaryTicketField
) => {
  return items.map(item =>
    transformToProductLineItems(item, complementaryTicketData)
  );
};
