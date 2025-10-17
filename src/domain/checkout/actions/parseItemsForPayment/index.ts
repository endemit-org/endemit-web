import { CartItem } from "@/types/cart";
import { Product } from "@/domain/product/types/product";

export const parseItemsForPayment = (
  items: CartItem[],
  products: Product[]
) => {
  const parsedItems: CartItem[] = [];
  items.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product) {
      parsedItems.push({
        ...item,
        quantity:
          product?.limits?.quantityLimit &&
          item.quantity > product.limits.quantityLimit
            ? product.limits.quantityLimit
            : item.quantity,
        price: product.price,
        type: item.type,
      });
    } else {
      console.warn(`Item with id ${item.id} is not valid for checkout`);
    }
  });
  return parsedItems;
};
