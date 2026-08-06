import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { DiscountCode } from "@prisma/client";

export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  return prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });
}
