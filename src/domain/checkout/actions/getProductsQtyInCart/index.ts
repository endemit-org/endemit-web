import { CartItem } from "@/types/cart";

export const getProductsQtyInCart = (
  cartItems: CartItem[],
  productIds: string[]
): number => {
  return productIds.reduce((total, productId) => {
    const item = cartItems.find(cartItem => cartItem.id === productId);
    return total + (item?.quantity ?? 0);
  }, 0);
};
