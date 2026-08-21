import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { PosPayoutType } from "@prisma/client";

export interface PosPayoutEntry {
  id: string;
  type: PosPayoutType;
  amount: number;
  note: string | null;
  createdAt: string;
  createdBy: { name: string | null; email: string | null };
}

export interface PosRegisterPayoutsResult {
  outstandingTips: number;
  outstandingCash: number;
  payouts: PosPayoutEntry[];
}

const HISTORY_SHOWN = 20;

/**
 * Outstanding amounts and payout history for one register.
 * Uncached — this backs the payout form, which must show live numbers.
 */
export async function getPosRegisterPayouts(
  registerId: string
): Promise<PosRegisterPayoutsResult> {
  const [register, topUpAgg, cashPickupAgg, payouts] = await Promise.all([
    prisma.posRegister.findUnique({
      where: { id: registerId },
      select: { tipPool: true },
    }),
    // Everything paid in physical cash lands in the drawer: cash-funded
    // top-ups AND cash sales (tips excluded — they live in tipPool)
    prisma.posOrderItem.aggregate({
      _sum: { total: true },
      where: {
        order: { registerId, status: "PAID", paymentMethod: "CASH" },
      },
    }),
    prisma.posPayout.aggregate({
      _sum: { amount: true },
      where: { registerId, type: "CASH" },
    }),
    prisma.posPayout.findMany({
      where: { registerId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_SHOWN,
      include: {
        createdBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  if (!register) throw new Error("Register not found");

  return {
    outstandingTips: register.tipPool,
    outstandingCash:
      (topUpAgg._sum.total ?? 0) - (cashPickupAgg._sum.amount ?? 0),
    payouts: payouts.map(p => ({
      id: p.id,
      type: p.type,
      amount: p.amount,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
      createdBy: p.createdBy,
    })),
  };
}
