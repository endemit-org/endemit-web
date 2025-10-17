import { CartItem } from "@/types/cart";
import { ProductInOrder } from "@/domain/order/types/order";

export const transformToProductInOrder = (cartItem: CartItem) => {
  const ProductInOrder: ProductInOrder = {
    id: cartItem.id,
    uid: cartItem.uid,
    name: cartItem.name,
    image: cartItem.images[0],
    price: cartItem.price,
    quantity: cartItem.quantity,
    currency: cartItem.currency,
    category: cartItem.category,
    checkoutDescription: cartItem.checkoutDescription,
  };
  return ProductInOrder;
};
