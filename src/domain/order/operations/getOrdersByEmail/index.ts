import "server-only";

import { prisma } from "@/lib/services/prisma";

const MAX_ORDERS_PER_EMAIL = 500;

export const getOrdersByEmail = async (email: string, limit?: number) => {
  return await prisma.order.findMany({
    where: {
      email,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit ?? MAX_ORDERS_PER_EMAIL,
  });
};
