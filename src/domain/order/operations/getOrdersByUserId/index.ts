import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  SerializedOrder,
  serializeOrder,
} from "@/domain/order/types/serialized";

const MAX_ORDERS_PER_USER = 500;

export const getOrdersByUserId = async (
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
