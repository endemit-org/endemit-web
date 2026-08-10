import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { DiscountCode } from "@prisma/client";
import type { DiscountCodeUpsertInput } from "@/domain/discount/types/discount";

export function assertValidDiscountInput(input: {
  value: number;
  valueType?: DiscountCodeUpsertInput["valueType"];
}) {
  if (input.value <= 0) throw new Error("Value must be greater than 0");
  if (input.valueType === "PERCENTAGE" && input.value > 100) {
    throw new Error("Percentage cannot exceed 100");
  }
}

export async function createDiscountCode(
  input: DiscountCodeUpsertInput
): Promise<DiscountCode> {
  if (!input.code.trim()) throw new Error("Code is required");
  assertValidDiscountInput(input);
  if (input.type === "ITEM" && !(input.targetProductUids ?? []).length) {
    throw new Error("Item discounts need at least one target product");
  }

  return prisma.discountCode.create({
    data: {
      code: input.code.trim().toUpperCase(),
      description: input.description || null,
      type: input.type,
      valueType: input.valueType,
      value: input.value,
      targetProductUids:
        input.type === "ITEM" ? (input.targetProductUids ?? []) : [],
      containsItemUids: input.containsItemUids ?? [],
      minOrderAmount: input.minOrderAmount ?? null,
      validFrom: input.validFrom ? new Date(input.validFrom) : null,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      maxUses: input.maxUses ?? null,
      status: input.status ?? "ACTIVE",
    },
  });
}
