import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { CacheTags } from "@/lib/services/cache";

export interface RegisterTrafficStats {
  salesRevenue: number; // DEBIT items total
  topUpsProcessed: number; // CREDIT items total (cash to collect)
  tipsCollected: number;
  paidOrdersCount: number;
}

export interface PosRegisterWithRelations {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE";
  canTopUp: boolean;
  tipPool: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    itemId: string;
    item: {
      id: string;
      name: string;
      cost: number;
      status: "ACTIVE" | "INACTIVE";
      direction: "CREDIT" | "DEBIT";
    };
  }>;
  sellers: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }>;
  _count: {
    orders: number;
  };
  traffic: RegisterTrafficStats;
}

export interface GetAllPosRegistersResult {
  registers: PosRegisterWithRelations[];
}

async function getAllPosRegistersUncached(): Promise<GetAllPosRegistersResult> {
  const registers = await prisma.posRegister.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      items: {
        include: {
          item: {
            select: {
              id: true,
              name: true,
              cost: true,
              status: true,
              direction: true,
            },
          },
        },
      },
      sellers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
      orders: {
        where: { status: "PAID" },
        select: {
          tipAmount: true,
          items: {
            select: {
              total: true,
              item: {
                select: {
                  direction: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Calculate traffic stats for each register
  const registersWithTraffic = registers.map(register => {
    const traffic: RegisterTrafficStats = {
      salesRevenue: 0,
      topUpsProcessed: 0,
      tipsCollected: 0,
      paidOrdersCount: register.orders.length,
    };

    for (const order of register.orders) {
      traffic.tipsCollected += order.tipAmount;
      for (const orderItem of order.items) {
        if (orderItem.item.direction === "DEBIT") {
          traffic.salesRevenue += orderItem.total;
        } else {
          traffic.topUpsProcessed += orderItem.total;
        }
      }
    }

    // Remove orders from the returned data (we only needed them for stats)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { orders: _, ...registerWithoutOrders } = register;
    return {
      ...registerWithoutOrders,
      traffic,
    };
  });

  return { registers: registersWithTraffic as PosRegisterWithRelations[] };
}

/**
 * Get all POS registers (cached)
 */
export function getAllPosRegisters(): Promise<GetAllPosRegistersResult> {
  return unstable_cache(getAllPosRegistersUncached, ["admin-pos-registers"], {
    tags: [CacheTags.admin.pos.registers()],
  })();
}
