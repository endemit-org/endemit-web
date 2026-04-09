import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import {
  SerializedOrder,
  serializeOrder,
} from "@/domain/order/types/serialized";
import { CacheTags } from "@/lib/services/cache";

const MAX_ORDERS_PER_USER = 500;
const LATEST_ORDERS_LIMIT = 5;

const getOrdersByUserIdUncached = async (
  userId: string,
  limit?: number
): Promise<SerializedOrder[]> => {
  const orders = await prisma.order.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: { tickets: true },
      },
    },
    take: limit ?? MAX_ORDERS_PER_USER,
  });

  return orders.map(order => serializeOrder(order));
};

/**
 * Get orders for a user (cached)
 * Uses user:{id}:orders tag for full list
 * Uses user:{id}:orders:latest tag for limited "latest" queries
 */
export const getOrdersByUserId = (
  userId: string,
  limit?: number
): Promise<SerializedOrder[]> => {
  // Use "latest" tag for small limit queries (profile overview)
  const isLatestQuery = limit !== undefined && limit <= LATEST_ORDERS_LIMIT;
  const tags = isLatestQuery
    ? [CacheTags.user.ordersLatest(userId)]
    : [CacheTags.user.orders(userId)];

  const cacheKey = ["orders-user", userId, String(limit ?? MAX_ORDERS_PER_USER)];

  return unstable_cache(
    () => getOrdersByUserIdUncached(userId, limit),
    cacheKey,
    { tags }
  )();
};
