import { prisma } from "@/services/prisma";

export const getOrdersByEmail = async (email: string) => {
  return await prisma.order.findMany({
    where: {
      email,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
