import { CartItem } from "@/domain/checkout/types/cartItem";

export const validateCheckoutItems = (items: CartItem[]) => {
  if (items.length === 0) {
    throw new Error("There are no valid items for checkout");
  }
  if (!items.every(item => item.price && item.price > 0)) {
    throw new Error("One or more items have invalid prices");
  }
};
