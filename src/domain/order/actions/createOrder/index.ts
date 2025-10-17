import { ShippingAddress } from "@/domain/checkout/types/checkout";

import { prisma } from "@/services/prisma";
import { ProductInOrder } from "@/domain/order/types/order";

export const createOrder = async ({
  stripeSessionId,
  name,
  email,
  subtotal,
  shippingCost,
  shippingRequired,
  shippingAddress,
  orderItems,
}: {
  stripeSessionId: string;
  name: string;
  email: string;
  subtotal: number;
  shippingCost: number;
  shippingRequired: boolean;
  shippingAddress?: ShippingAddress;
  orderItems: ProductInOrder[];
}) => {
  return await prisma.order.create({
    data: {
      stripeSession: stripeSessionId,
      name,
      email,
      subtotal,
      totalAmount: subtotal + shippingCost,
      shippingAmount: shippingCost,
      shippingRequired,
      shippingAddress,
      items: JSON.parse(JSON.stringify({ items: orderItems })),
    },
  });
};
