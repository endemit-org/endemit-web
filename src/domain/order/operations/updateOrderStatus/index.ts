import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import { validateTransition } from "./transitions";
import { bustOnOrderStatusChanged } from "@/lib/services/cache";

export const updateOrderStatus = async (
  stripeSessionId: string,
  status: OrderStatus
) => {
  const order = await prisma.order.update({
    where: {
      stripeSession: stripeSessionId,
    },
    data: {
      status,
    },
  });

  await bustOnOrderStatusChanged(order.id, order.userId);

  return order;
};

export const updateOrderStatusById = async (
  orderId: string,
  status: OrderStatus
) => {
  const order = await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
  });

  await bustOnOrderStatusChanged(order.id, order.userId);

  return order;
};

/**
 * Update order status with validation.
 * Fetches current status and validates the transition before updating.
 */
export const updateOrderStatusValidated = async (
  orderId: string,
  newStatus: OrderStatus
) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  validateTransition(order.status, newStatus);

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  await bustOnOrderStatusChanged(updatedOrder.id, updatedOrder.userId);

  return updatedOrder;
};

export const updateOrderStatusPaid = async (stripeSessionId: string) => {
  return await updateOrderStatus(stripeSessionId, OrderStatus.PAID);
};

export const updateOrderStatusPaidById = async (orderId: string) => {
  return await updateOrderStatusById(orderId, OrderStatus.PAID);
};

export const updateOrderStatusCancelled = async (stripeSessionId: string) => {
  return await updateOrderStatus(stripeSessionId, OrderStatus.CANCELLED);
};

export const updateOrderStatusExpired = async (stripeSessionId: string) => {
  return await updateOrderStatus(stripeSessionId, OrderStatus.EXPIRED);
};

// Re-export transition utilities
export { canTransition, validateTransition, getNextStatus, getPossibleTransitions } from "./transitions";
