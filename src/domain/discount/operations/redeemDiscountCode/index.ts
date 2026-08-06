import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Counts one redemption for a code. Called when an order transitions to PAID.
 * The increment is atomic; the maxUses cap is soft-enforced at validation
 * time, so concurrent payments may overshoot it by design.
 */
export async function redeemDiscountCode(discountCodeId: string): Promise<void> {
  await prisma.discountCode.update({
    where: { id: discountCodeId },
    data: { usedCount: { increment: 1 } },
  });
}
