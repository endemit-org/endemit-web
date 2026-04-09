import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { OrderStatus } from "@prisma/client";
import { CacheTags } from "@/lib/services/cache";

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

const getOrderStatsUncached = async (): Promise<OrderStats> => {
  // Use aggregate queries instead of fetching all orders
  const [paidOrdersAggregate, pendingCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: PAID_STATUSES } },
      _sum: {
        totalAmount: true,
        refundedAmount: true,
      },
      _count: true,
    }),
    prisma.order.count({ where: { status: OrderStatus.CREATED } }),
  ]);

  // Calculate revenue: totalAmount minus any refunded amounts
  const totalAmount = Number(paidOrdersAggregate._sum.totalAmount ?? 0);
  const refundedAmount = (paidOrdersAggregate._sum.refundedAmount ?? 0) / 100; // refundedAmount is in cents
  const totalRevenue = totalAmount - refundedAmount;

  return {
    totalRevenue,
    orderCount: paidOrdersAggregate._count,
    pendingCount,
  };
};

/**
 * Get order statistics (cached)
 */
export const getOrderStats = (): Promise<OrderStats> => {
  return unstable_cache(getOrderStatsUncached, ["admin-order-stats"], {
    tags: [CacheTags.admin.orders.stats()],
  })();
};
