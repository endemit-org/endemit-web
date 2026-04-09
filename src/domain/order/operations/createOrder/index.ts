import { ShippingAddress } from "@/domain/checkout/types/checkout";

import { prisma } from "@/lib/services/prisma";
import { ProductInOrder } from "@/domain/order/types/order";
import { Prisma } from "@prisma/client";
import { findOrCreateUserByEmail } from "@/domain/user/operations/findOrCreateUserByEmail";
import { bustOnOrderCreated } from "@/lib/services/cache";

interface CreateOrderParams {
  stripeSessionId: string;
  name: string;
  email: string;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  walletAmountUsed?: number; // in cents
  shippingRequired: boolean;
  shippingAddress?: ShippingAddress;
  orderItems: ProductInOrder[];
  metadata?: Prisma.InputJsonValue;
  userId?: string;
}

interface CreateOrderResult {
  order: Awaited<ReturnType<typeof prisma.order.create>>;
  userId: string;
  isNewUser: boolean;
}

export const createOrder = async ({
  stripeSessionId,
  name,
  email,
  subtotal,
  shippingCost,
  discountAmount,
  walletAmountUsed = 0,
  shippingRequired,
  shippingAddress,
  orderItems,
  metadata,
  userId,
}: CreateOrderParams): Promise<CreateOrderResult> => {
  // Find or create user by email if userId not provided
  let resolvedUserId = userId;
  let isNewUser = false;

  if (!resolvedUserId) {
    const result = await findOrCreateUserByEmail(email);
    resolvedUserId = result.user.id;
    isNewUser = result.user.isNewUser;
  }

  const order = await prisma.order.create({
    data: {
      stripeSession: stripeSessionId,
      userId: resolvedUserId,
      name,
      email,
      subtotal,
      totalAmount: subtotal + shippingCost + discountAmount,
      shippingAmount: shippingCost,
      discountAmount,
      walletAmountUsed,
      shippingRequired,
      shippingAddress,
      items: JSON.parse(JSON.stringify(orderItems)),
      metadata,
    },
  });

  await bustOnOrderCreated(order.id, resolvedUserId);

  return {
    order,
    userId: resolvedUserId,
    isNewUser,
  };
};
