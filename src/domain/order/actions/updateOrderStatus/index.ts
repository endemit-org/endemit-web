import { OrderStatus } from "@prisma/client";
import { prisma } from "@/app/services/prisma";

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

export const updateOrderStatusPaid = async (stripeSessionId: string) => {
  return await updateOrderStatus(stripeSessionId, OrderStatus.PAID);
};

export const updateOrderStatusCancelled = async (stripeSessionId: string) => {
  return await updateOrderStatus(stripeSessionId, OrderStatus.CANCELLED);
};

export const updateOrderStatusExpired = async (stripeSessionId: string) => {
  return await updateOrderStatus(stripeSessionId, OrderStatus.EXPIRED);
};
