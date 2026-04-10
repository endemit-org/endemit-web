import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import type { PosItem } from "@prisma/client";
import { CacheTags } from "@/lib/services/cache";

export interface PosItemWithSalesCount extends PosItem {
  soldLast30Days: number;
  revenueLast30Days: number;
}

export interface GetAllPosItemsResult {
  items: PosItemWithSalesCount[];
}

async function getAllPosItemsUncached(): Promise<GetAllPosItemsResult> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all items
  const items = await prisma.posItem.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  // Get sales counts and revenue for the last 30 days
  const salesCounts = await prisma.posOrderItem.groupBy({
    by: ["itemId"],
    _sum: {
      quantity: true,
      total: true,
    },
    where: {
      order: {
        status: "PAID",
        paidAt: {
          gte: thirtyDaysAgo,
        },
      },
    },
  });

  // Create a map of itemId -> { quantity, revenue }
  const salesMap = new Map(
    salesCounts.map(s => [
      s.itemId,
      { quantity: s._sum.quantity ?? 0, revenue: s._sum.total ?? 0 },
    ])
  );

  // Combine items with their sales counts
  const itemsWithSales: PosItemWithSalesCount[] = items.map(item => ({
    ...item,
    soldLast30Days: salesMap.get(item.id)?.quantity ?? 0,
    revenueLast30Days: salesMap.get(item.id)?.revenue ?? 0,
  }));

  return { items: itemsWithSales };
}

/**
 * Get all POS items (cached)
 */
export function getAllPosItems(): Promise<GetAllPosItemsResult> {
  return unstable_cache(getAllPosItemsUncached, ["admin-pos-items"], {
    tags: [CacheTags.admin.pos.items()],
  })();
}
