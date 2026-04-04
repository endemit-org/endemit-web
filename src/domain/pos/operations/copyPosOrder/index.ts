import "server-only";

import { prisma } from "@/lib/services/prisma";
import { cancelPosOrder } from "@/domain/pos/operations/cancelPosOrder";
import { createPosOrder } from "@/domain/pos/operations/createPosOrder";

export async function copyPosOrder(orderHash: string, sellerId: string) {
  // Get the original order
  const originalOrder = await prisma.posOrder.findUnique({
    where: { orderHash },
    include: {
      items: true,
    },
  });

  if (!originalOrder) {
    throw new Error("Order not found");
  }

  if (originalOrder.sellerId !== sellerId) {
    throw new Error("Not authorized to copy this order");
  }

  // Cancel the original order
  await cancelPosOrder(orderHash, sellerId, "seller");

  // Create a new order with the same items
  const newOrder = await createPosOrder({
    registerId: originalOrder.registerId,
    sellerId,
    items: originalOrder.items.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
    })),
  });

  // Update the original order to reference the new one
  await prisma.posOrder.update({
    where: { id: originalOrder.id },
    data: { copiedFromId: newOrder.id },
  });

  return newOrder;
}
