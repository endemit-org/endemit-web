import "server-only";

import { prisma } from "@/lib/services/prisma";
import {
  SerializedOrderWithTickets,
  serializeOrderWithTickets,
} from "@/domain/order/types/serialized";

export const getOrderWithTickets = async (
  orderId: string
): Promise<SerializedOrderWithTickets | null> => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      tickets: true,
    },
  });

  if (!order) {
    return null;
  }

  return serializeOrderWithTickets(order);
};
