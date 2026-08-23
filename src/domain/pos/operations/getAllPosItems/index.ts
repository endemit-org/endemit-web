import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import type { PosItem } from "@prisma/client";
import { CacheTags } from "@/lib/services/cache";

export interface PosItemWithSalesCount extends PosItem {
  soldLast30Days: number;
  revenueLast30Days: number;
  soldAllTime: number;
  revenueAllTime: number;
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

  // Get sales counts and revenue, last 30 days and all-time
  const [salesCounts30d, salesCountsAllTime] = await Promise.all([
    prisma.posOrderItem.groupBy({
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
    }),
    prisma.posOrderItem.groupBy({
      by: ["itemId"],
      _sum: {
        quantity: true,
        total: true,
      },
      where: {
        order: { status: "PAID" },
      },
    }),
  ]);

  const toSalesMap = (
    counts: typeof salesCounts30d
  ): Map<string, { quantity: number; revenue: number }> =>
    new Map(
      counts.map(s => [
        s.itemId,
        { quantity: s._sum.quantity ?? 0, revenue: s._sum.total ?? 0 },
      ])
    );

  const salesMap30d = toSalesMap(salesCounts30d);
  const salesMapAllTime = toSalesMap(salesCountsAllTime);

  // Combine items with their sales counts
  const itemsWithSales: PosItemWithSalesCount[] = items.map(item => ({
    ...item,
    soldLast30Days: salesMap30d.get(item.id)?.quantity ?? 0,
    revenueLast30Days: salesMap30d.get(item.id)?.revenue ?? 0,
    soldAllTime: salesMapAllTime.get(item.id)?.quantity ?? 0,
    revenueAllTime: salesMapAllTime.get(item.id)?.revenue ?? 0,
  }));

  return { items: itemsWithSales };
}

/**
 * Get all POS items (cached)
 */
export function getAllPosItems(): Promise<GetAllPosItemsResult> {
  return unstable_cache(getAllPosItemsUncached, ["admin-pos-items"], {
    tags: [CacheTags.admin.pos.items()],
    // The 30-day sales window is computed at cache-fill time, so the cache
    // must expire periodically for the window to slide even without sales.
    revalidate: 3600,
  })();
}
