import "server-only";

import { prisma } from "@/lib/services/prisma";

export const getOrderByStripeSession = async (stripeSessionId: string) => {
  return await prisma.order.findUnique({
    where: {
      stripeSession: stripeSessionId,
    },
  });
};
