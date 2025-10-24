import { isProductTicket } from "@/domain/product/businessLogic";
import { CartItem } from "@/domain/checkout/types/cartItem";

export const transformToComplementaryTicketModel = (
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
