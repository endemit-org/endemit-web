import { CartItem } from "@/domain/checkout/types/cartItem";

export const getCalculatedSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};
