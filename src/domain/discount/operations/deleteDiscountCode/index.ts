import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Hard-deletes a code. Orders keep their history via the SetNull relation
 * plus the discountCodeKey snapshot.
 */
export async function deleteDiscountCode(id: string): Promise<void> {
  await prisma.discountCode.delete({ where: { id } });
}
