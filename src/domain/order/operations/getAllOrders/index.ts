import "server-only";

import { unstable_cache } from "next/cache";
import { OrderStatus, Prisma } from "@prisma/client";
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
  /** Free-text search over email, name, order id and Stripe session. */
  search?: string;
  status?: OrderStatus;
}

const getAllOrdersUncached = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
  status,
}: GetAllOrdersParams = {}): Promise<PaginatedOrders> => {
  const where: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { id: { contains: search, mode: "insensitive" } },
            { stripeSession: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [totalCount, totalRevenueResult] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.aggregate({
      // Revenue within the current filter, still counting PAID orders only.
      where: { ...where, status: "PAID" },
      _sum: {
        totalAmount: true,
      },
    }),
  ]);

  const pagination = calculatePagination(totalCount, page, pageSize);

  const orders = await prisma.order.findMany({
    where,
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
 * Get all orders (cached).
 *
 * Filtered queries (search/status) skip the cache: search strings are
 * unbounded so caching every variant would just pollute the cache store.
 */
export const getAllOrders = (
  params: GetAllOrdersParams = {}
): Promise<PaginatedOrders> => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search, status } = params;

  if (search || status) {
    return getAllOrdersUncached(params);
  }

  return unstable_cache(
    () => getAllOrdersUncached(params),
    ["admin-orders", String(page), String(pageSize)],
    { tags: [CacheTags.admin.orders.list()] }
  )();
};
