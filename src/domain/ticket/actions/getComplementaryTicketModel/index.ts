import { CartItem } from "@/types/cart";
import { isProductTicket } from "@/domain/product/businessLogic";

export const getComplementaryTicketModel = (
  items: CartItem[],
  defaultValue: string = ""
) => {
  return items
    .filter(item => isProductTicket(item))
    .flatMap(item =>
      Array.from({ length: item.quantity }, (_, index) => ({
        [`ticket-${item.id}-${index + 1}-name`]: defaultValue,
      }))
    )
    .reduce((acc, curr) => ({ ...acc, ...curr }), {});
};
