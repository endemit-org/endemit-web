import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { bustOnPosOrderCreated } from "@/lib/services/cache";

export async function cancelPosOrder(
  orderHash: string,
  sellerId: string,
  reason: "seller" | "expired" = "seller"
) {
  const order = await prisma.posOrder.findUnique({
    where: { orderHash },
    include: { register: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PENDING") {
    throw new Error(`Cannot cancel order with status ${order.status}`);
  }

  // Verify seller owns this order (unless system expiry)
  if (reason === "seller" && order.sellerId !== sellerId) {
    throw new Error("Not authorized to cancel this order");
  }

  const updatedOrder = await prisma.posOrder.update({
    where: { id: order.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelReason: reason,
    },
  });

  // Broadcast to customer if they've scanned
  if (order.customerId) {
    await broadcastToChannel(`pos:order:${order.id}`, "pos_order_cancelled", {
      orderId: order.id,
      shortCode: order.shortCode,
      reason,
    });
  }

  // Broadcast to register
  await broadcastToChannel(
    `pos:register:${order.registerId}`,
    "pos_order_cancelled",
    {
      orderId: order.id,
      shortCode: order.shortCode,
      reason,
    }
  );

  await bustOnPosOrderCreated();

  return updatedOrder;
}
