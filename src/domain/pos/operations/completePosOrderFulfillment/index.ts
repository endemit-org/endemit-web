import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";

/** Mark a to-serve order as served/done; syncs sidebar + kitchen displays. */
export async function completePosOrderFulfillment(orderHash: string) {
  const order = await prisma.posOrder.findUnique({
    where: { orderHash },
    select: {
      id: true,
      registerId: true,
      status: true,
      fulfillmentStatus: true,
      queueNumber: true,
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "PAID" || order.fulfillmentStatus !== "OPEN") {
    throw new Error("Order is not awaiting fulfillment");
  }

  const updated = await prisma.posOrder.update({
    where: { id: order.id },
    data: { fulfillmentStatus: "COMPLETED", fulfilledAt: new Date() },
  });

  after(async () => {
    await broadcastToChannel(
      `pos:register:${order.registerId}`,
      "pos_order_fulfilled",
      { orderId: order.id, queueNumber: order.queueNumber }
    ).catch(() => {});
  });

  return updated;
}
