import "server-only";

import { prisma } from "@/lib/services/prisma";
import { ProductCategory } from "@/domain/product/types/product";
import { ProductInOrder } from "@/domain/order/types/order";
import { OrderStatus } from "@prisma/client";

/**
 * Checks if a user has made any donation purchases.
 * Returns true if any of their orders contain a donation product.
 */
export async function checkUserIsDonor(userId: string): Promise<boolean> {
  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: {
        in: [OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.PREPARING, OrderStatus.IN_DELIVERY],
      },
    },
    select: {
      items: true,
    },
  });

  for (const order of orders) {
    const items = order.items as unknown as ProductInOrder[];
    if (Array.isArray(items)) {
      const hasDonation = items.some(
        item => item.category === ProductCategory.DONATIONS
      );
      if (hasDonation) {
        return true;
      }
    }
  }

  return false;
}
