import { Order } from "@prisma/client";

export const includesShippableProduct = (order: Order) => {
  return order.items && order.shippingRequired === true;
};
