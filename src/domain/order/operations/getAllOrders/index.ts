import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import {
  PaginatedOrders,
  serializeOrder,
} from "@/domain/order/types/serialized";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
} from "@/lib/types/pagination";
import { CacheTags } from "@/lib/services/cache";

interface GetAllOrdersParams {
  page?: number;
  pageSize?: number;
}

const getAllOrdersUncached = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetAllOrdersParams = {}): Promise<PaginatedOrders> => {
  const [totalCount, totalRevenueResult] = await Promise.all([
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

  const pagination = calculatePagination(totalCount, page, pageSize);

  const orders = await prisma.order.findMany({
    skip: pagination.skip,
    take: pagination.take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { tickets: true },
      },
    },
  });

  return {
    orders: orders.map(order => serializeOrder(order)),
    totalCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    totalRevenue: Number(totalRevenueResult._sum.totalAmount ?? 0),
  };
};

/**
 * Get all orders (cached)
 */
export const getAllOrders = (
  params: GetAllOrdersParams = {}
): Promise<PaginatedOrders> => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  return unstable_cache(
    () => getAllOrdersUncached(params),
    ["admin-orders", String(page), String(pageSize)],
    { tags: [CacheTags.admin.orders.list()] }
  )();
};
