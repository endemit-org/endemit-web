import "server-only";

import { prisma } from "@/lib/services/prisma";

export interface OrderStats {
  totalRevenue: number;
  orderCount: number;
  pendingCount: number;
}

export const getOrderStats = async (): Promise<OrderStats> => {
  const [revenueAgg, pendingCount] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.count({ where: { status: "CREATED" } }),
  ]);

  return {
    totalRevenue: Number(revenueAgg._sum.totalAmount ?? 0),
    orderCount: revenueAgg._count,
    pendingCount,
  };
};
