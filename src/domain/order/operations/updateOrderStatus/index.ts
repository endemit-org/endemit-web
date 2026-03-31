import "server-only";

import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/services/prisma";
import { validateTransition } from "./transitions";

export const updateOrderStatus = async (
  stripeSessionId: string,
  status: OrderStatus
) => {
  return await prisma.order.update({
    where: {
      stripeSession: stripeSessionId,
    },
    data: {
      status,
    },
  });
};

export const updateOrderStatusById = async (
  orderId: string,
  status: OrderStatus
) => {
  return await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
  });
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

  return await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
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
