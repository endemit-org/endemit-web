import { DeliveryMethod, Order } from "@prisma/client";

export const includesShippableProduct = (order: Order) => {
  return order.items && order.shippingRequired === true;
};

export const isPickupOrder = (
  order: Pick<Order, "shippingRequired" | "deliveryMethod">
) => {
  return (
    order.shippingRequired === true &&
    order.deliveryMethod === DeliveryMethod.PICKUP
  );
};
