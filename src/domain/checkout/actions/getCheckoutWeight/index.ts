import { CartItem } from "@/types/cart";

export const getCheckoutWeight = (cartItems: CartItem[]) => {
  const paddingForPackaging = 100; // 100g padding for packaging
  const minimumShipmentWeight = 200; // Minimum weight for shipping is 200g
  const paddingPercentPerItem = 0.05; // 5% padding per item

  const itemsWeight = Math.max(
    cartItems.reduce(
      (total, item) =>
        total + item.weight * item.quantity * (1 + paddingPercentPerItem),
      0
    ),
    minimumShipmentWeight
  );

  return itemsWeight + paddingForPackaging;
};
