import { ShippingAddress } from "@/domain/checkout/types/checkout";

import { prisma } from "@/lib/services/prisma";
import { ProductInOrder } from "@/domain/order/types/order";
import { Prisma } from "@prisma/client";

export const createOrder = async ({
  stripeSessionId,
  name,
  email,
  subtotal,
  shippingCost,
  discountAmount,
  shippingRequired,
  shippingAddress,
  orderItems,
  metadata,
}: {
  stripeSessionId: string;
  name: string;
  email: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  shippingRequired: boolean;
  shippingAddress?: ShippingAddress;
  orderItems: ProductInOrder[];
  metadata?: Prisma.InputJsonValue;
}) => {
  return await prisma.order.create({
    data: {
      stripeSession: stripeSessionId,
      name,
      email,
      subtotal,
      totalAmount: subtotal + shippingCost + discountAmount,
      shippingAmount: shippingCost,
      discountAmount,
      shippingRequired,
      shippingAddress,
      items: JSON.parse(JSON.stringify(orderItems)),
      metadata,
    },
  });
};
