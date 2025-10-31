import { Order } from "@prisma/client";
import { ProductCategory, ProductType } from "@/domain/product/types/product";
import { ProductInOrder } from "@/domain/order/types/order";

export const transformTicketsFromOrder = (order: Order) => {
  if (!order.items) {
    return null;
  }

  const items = order.items as unknown as ProductInOrder[];

  return items.filter(item => {
    const isDigitalTicket =
      item.type === ProductType.DIGITAL &&
      item.category === ProductCategory.TICKETS;

    return isDigitalTicket;
  });
};
