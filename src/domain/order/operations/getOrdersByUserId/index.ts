import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  SerializedOrder,
  serializeOrder,
} from "@/domain/order/types/serialized";

export const getOrdersByUserId = async (
  userId: string
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
  });

  return orders.map(order => serializeOrder(order));
};
