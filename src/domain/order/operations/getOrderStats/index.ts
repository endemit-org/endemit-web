import "server-only";

import { prisma } from "@/lib/services/prisma";
import { OrderStatus } from "@prisma/client";

// Statuses that represent successful payment (count towards revenue)
const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.IN_DELIVERY,
  OrderStatus.COMPLETED,
  OrderStatus.REFUND_REQUESTED,
  OrderStatus.PARTIALLY_REFUNDED,
];

export interface OrderStats {
  totalRevenue: number;
  orderCount: number;
  pendingCount: number;
}

export const getOrderStats = async (): Promise<OrderStats> => {
  const [paidOrders, pendingCount] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: PAID_STATUSES } },
      select: {
        totalAmount: true,
        refundedAmount: true,
      },
    }),
    prisma.order.count({ where: { status: OrderStatus.CREATED } }),
  ]);

  // Calculate revenue: totalAmount minus any refunded amounts
  const totalRevenue = paidOrders.reduce((sum, order) => {
    const orderTotal = Number(order.totalAmount);
    const refunded = order.refundedAmount ?? 0;
    return sum + (orderTotal - refunded / 100); // refundedAmount is in cents
  }, 0);

  return {
    totalRevenue,
    orderCount: paidOrders.length,
    pendingCount,
  };
};
