import { prisma } from "@/services/prisma";

export const getOrderById = async (orderId: string) => {
  return await prisma.order.findUnique({
    where: {
      id: orderId,
    },
  });
};
