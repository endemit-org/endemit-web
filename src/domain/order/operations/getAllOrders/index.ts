import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  PaginatedOrders,
  serializeOrder,
} from "@/domain/order/types/serialized";

const PAGE_SIZE = 50;

interface GetAllOrdersParams {
  cursor?: string;
  pageSize?: number;
}

export const getAllOrders = async ({
  cursor,
  pageSize = PAGE_SIZE,
}: GetAllOrdersParams = {}): Promise<PaginatedOrders> => {
  const [orders, totalCount, totalRevenueResult] = await Promise.all([
    prisma.order.findMany({
      take: pageSize + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: { tickets: true },
        },
      },
    }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: {
        status: "PAID",
      },
      _sum: {
        totalAmount: true,
      },
    }),
  ]);

  const hasMore = orders.length > pageSize;
  const ordersToReturn = hasMore ? orders.slice(0, -1) : orders;
  const nextCursor = hasMore ? ordersToReturn[ordersToReturn.length - 1]?.id : null;

  return {
    orders: ordersToReturn.map(order => serializeOrder(order)),
    nextCursor,
    totalCount,
    totalRevenue: Number(totalRevenueResult._sum.totalAmount ?? 0),
  };
};
