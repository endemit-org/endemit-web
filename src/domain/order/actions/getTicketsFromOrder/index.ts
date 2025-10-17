import { Order } from "@prisma/client";
import { ProductCategory, ProductType } from "@/domain/product/types/product";
import { CustomStripeLineItem } from "@/domain/checkout/types/checkout";

export const getTicketsFromOrder = (order: Order) => {
  if (!order.items) {
    return null;
  }

  const items = JSON.parse(order.items as string) as CustomStripeLineItem[];

  items.filter(item => {
    const isDigitalTicket =
      item.price_data?.product_data?.metadata?.productType ===
        ProductType.DIGITAL &&
      item.price_data?.product_data?.metadata?.productCategory ===
        ProductCategory.TICKETS;

    return isDigitalTicket;
  });

  return items;
};
