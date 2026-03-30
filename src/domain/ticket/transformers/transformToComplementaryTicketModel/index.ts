import {
  isProductTicket,
  getTicketQuantityForProduct,
} from "@/domain/product/businessLogic";
import { CartItem } from "@/domain/checkout/types/cartItem";

export const transformToComplementaryTicketModel = (
  items: CartItem[],
  defaultValue: string = ""
) => {
  return items
    .filter(item => isProductTicket(item))
    .flatMap(item => {
      const ticketQuantity = getTicketQuantityForProduct(item);
      const totalSlots = item.quantity * ticketQuantity;
      return Array.from({ length: totalSlots }, (_, index) => ({
        [`ticket-${item.id}-${index + 1}-name`]: defaultValue,
      }));
    })
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});
};
