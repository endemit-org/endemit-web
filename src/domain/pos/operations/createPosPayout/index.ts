import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { PosPayoutType } from "@prisma/client";
import { bustOnPosPayout } from "@/lib/services/cache";

export interface CreatePosPayoutInput {
  registerId: string;
  type: PosPayoutType;
  amount: number; // cents
  note?: string;
  createdById: string;
}

export interface CreatePosPayoutResult {
  id: string;
  outstandingAfter: number;
}

/**
 * Record cash leaving a register — a tip-pool payout or a top-up cash pickup.
 * Validates against the freshly computed outstanding amount inside the
 * transaction so concurrent payouts cannot overdraw.
 */
export async function createPosPayout(
  input: CreatePosPayoutInput
): Promise<CreatePosPayoutResult> {
  const { registerId, type, amount, note, createdById } = input;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer (cents)");
  }

  const result = await prisma.$transaction(async tx => {
    const register = await tx.posRegister.findUnique({
      where: { id: registerId },
      select: { id: true, tipPool: true },
    });
    if (!register) throw new Error("Register not found");

    let outstanding: number;
    if (type === "TIPS") {
      outstanding = register.tipPool;
    } else {
      const [topUpAgg, pickupAgg] = await Promise.all([
        // Drawer contents: all CASH-method order items (top-ups + sales,
        // tips excluded — they live in tipPool)
        tx.posOrderItem.aggregate({
          _sum: { total: true },
          where: {
            order: { registerId, status: "PAID", paymentMethod: "CASH" },
          },
        }),
        tx.posPayout.aggregate({
          _sum: { amount: true },
          where: { registerId, type: "CASH" },
        }),
      ]);
      outstanding =
        (topUpAgg._sum.total ?? 0) - (pickupAgg._sum.amount ?? 0);
    }

    if (amount > outstanding) {
      throw new Error("Amount exceeds the outstanding balance");
    }

    const payout = await tx.posPayout.create({
      data: {
        registerId,
        type,
        amount,
        note: note?.trim() || null,
        createdById,
      },
    });

    if (type === "TIPS") {
      await tx.posRegister.update({
        where: { id: registerId },
        data: { tipPool: { decrement: amount } },
      });
    }

    return { id: payout.id, outstandingAfter: outstanding - amount };
  });

  await bustOnPosPayout();

  return result;
}
