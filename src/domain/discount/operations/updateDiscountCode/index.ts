import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { DiscountCode } from "@prisma/client";
import type { DiscountCodeUpsertInput } from "@/domain/discount/types/discount";
import { assertValidDiscountInput } from "@/domain/discount/operations/createDiscountCode";

export async function updateDiscountCode(
  id: string,
  input: Partial<DiscountCodeUpsertInput>
): Promise<DiscountCode> {
  if (input.value != null) {
    assertValidDiscountInput({ value: input.value, valueType: input.valueType });
  }

  return prisma.discountCode.update({
    where: { id },
    data: {
      ...(input.code != null && { code: input.code.trim().toUpperCase() }),
      ...(input.description !== undefined && {
        description: input.description || null,
      }),
      ...(input.type != null && { type: input.type }),
      ...(input.valueType != null && { valueType: input.valueType }),
      ...(input.value != null && { value: input.value }),
      ...(input.targetProductUids != null && {
        targetProductUids: input.targetProductUids,
      }),
      ...(input.containsItemUids != null && {
        containsItemUids: input.containsItemUids,
      }),
      ...(input.minOrderAmount !== undefined && {
        minOrderAmount: input.minOrderAmount,
      }),
      ...(input.validFrom !== undefined && {
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
      }),
      ...(input.validUntil !== undefined && {
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
      }),
      ...(input.maxUses !== undefined && { maxUses: input.maxUses }),
      ...(input.status != null && { status: input.status }),
    },
  });
}
