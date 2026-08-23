import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { CacheTags } from "@/lib/services/cache";

export interface PosRegisterReportItem {
  itemId: string;
  name: string;
  direction: "CREDIT" | "DEBIT";
  quantity: number;
  total: number;
}

export interface PosRegisterReportMethodStats {
  method: "WALLET" | "CASH" | "CARD";
  orders: number;
  revenue: number;
  tips: number;
}

export interface PosRegisterReport {
  registerId: string;
  paidOrdersCount: number;
  totalItemsSold: number;
  salesRevenue: number;
  topUpsProcessed: number;
  tipsCollected: number;
  /** Sales revenue + tips (what customers paid, excluding top-ups). */
  grossTotal: number;
  lowestOrderTotal: number;
  highestOrderTotal: number;
  averageOrderTotal: number;
  highestTip: number;
  byMethod: PosRegisterReportMethodStats[];
  items: PosRegisterReportItem[];
}

async function getPosRegisterReportUncached(
  registerId: string
): Promise<PosRegisterReport> {
  const [orderAgg, methodGroups, itemGroups] = await Promise.all([
    prisma.posOrder.aggregate({
      where: { registerId, status: "PAID" },
      _count: true,
      _sum: { tipAmount: true },
      _min: { total: true },
      _max: { total: true, tipAmount: true },
      _avg: { total: true },
    }),
    prisma.posOrder.groupBy({
      by: ["paymentMethod"],
      _count: true,
      _sum: { total: true, tipAmount: true },
      where: { registerId, status: "PAID" },
    }),
    prisma.posOrderItem.groupBy({
      by: ["itemId"],
      _sum: { quantity: true, total: true },
      where: {
        order: { registerId, status: "PAID" },
      },
    }),
  ]);

  const itemIds = itemGroups.map(g => g.itemId);
  const itemDetails = await prisma.posItem.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, name: true, direction: true },
  });
  const detailMap = new Map(itemDetails.map(i => [i.id, i]));

  const items: PosRegisterReportItem[] = itemGroups
    .map(g => {
      const detail = detailMap.get(g.itemId);
      return {
        itemId: g.itemId,
        name: detail?.name ?? "?",
        direction: (detail?.direction ?? "DEBIT") as "CREDIT" | "DEBIT",
        quantity: g._sum.quantity ?? 0,
        total: g._sum.total ?? 0,
      };
    })
    .sort((a, b) => b.quantity - a.quantity);

  const salesRevenue = items
    .filter(i => i.direction === "DEBIT")
    .reduce((sum, i) => sum + i.total, 0);
  const topUpsProcessed = items
    .filter(i => i.direction === "CREDIT")
    .reduce((sum, i) => sum + i.total, 0);
  const tipsCollected = orderAgg._sum.tipAmount ?? 0;

  return {
    registerId,
    paidOrdersCount: orderAgg._count,
    totalItemsSold: items
      .filter(i => i.direction === "DEBIT")
      .reduce((sum, i) => sum + i.quantity, 0),
    salesRevenue,
    topUpsProcessed,
    tipsCollected,
    grossTotal: salesRevenue + tipsCollected,
    lowestOrderTotal: orderAgg._min.total ?? 0,
    highestOrderTotal: orderAgg._max.total ?? 0,
    averageOrderTotal: Math.round(orderAgg._avg.total ?? 0),
    highestTip: orderAgg._max.tipAmount ?? 0,
    byMethod: methodGroups
      .filter(g => g.paymentMethod !== null)
      .map(g => ({
        method: g.paymentMethod as "WALLET" | "CASH" | "CARD",
        orders: g._count,
        revenue: g._sum.total ?? 0,
        tips: g._sum.tipAmount ?? 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    items,
  };
}

/**
 * Get a sales report for one register (cached, busted with the registers tag)
 */
export function getPosRegisterReport(
  registerId: string
): Promise<PosRegisterReport> {
  return unstable_cache(
    () => getPosRegisterReportUncached(registerId),
    ["admin-pos-register-report", registerId],
    { tags: [CacheTags.admin.pos.registers()] }
  )();
}
