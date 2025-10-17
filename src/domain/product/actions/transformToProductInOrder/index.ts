import { CartItem } from "@/types/cart";
import { ProductInOrder } from "@/domain/order/types/order";
import { isProductTicket } from "@/domain/product/businessLogic";
import { getTicketHoldersFromData } from "@/domain/checkout/actions/getTicketHoldersFromData";
import { ComplementaryTicketField } from "@/domain/checkout/types/checkout";

export const transformToProductInOrder = (
  cartItem: CartItem,
  complementaryTicketData?: ComplementaryTicketField
) => {
  let metadata;

  if (isProductTicket(cartItem) && complementaryTicketData) {
    const ticketHolders = getTicketHoldersFromData({
      complementaryTicketData,
      id: cartItem.id,
      quantity: cartItem.quantity,
    });
    metadata = {
      ticketHolders,
    };
  }

  const ProductInOrder: ProductInOrder = {
    id: cartItem.id,
    uid: cartItem.uid,
    name: cartItem.name,
    image: cartItem.images[0],
    price: cartItem.price,
    quantity: cartItem.quantity,
    currency: cartItem.currency,
    category: cartItem.category,
    type: cartItem.type,
    checkoutDescription: cartItem.checkoutDescription,
    relatedEvent: cartItem.relatedEvent?.id ?? null,
    metadata,
  };
  return ProductInOrder;
};
