import { prisma } from "@/app/services/prisma";

export const getOrderByStripeSession = async (stripeSessionId: string) => {
  return await prisma.order.findUnique({
    where: {
      stripeSession: stripeSessionId,
    },
  });
};
