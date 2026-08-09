import type { DiscountCode } from "@prisma/client";
import type { DiscountRule } from "@/domain/discount/types/discount";

/** Prisma row → serializable rule (Decimal → number, Date → ISO string). */
export function transformDiscountCodeToRule(record: DiscountCode): DiscountRule {
  return {
    id: record.id,
    code: record.code,
    description: record.description,
    status: record.status,
    type: record.type,
    valueType: record.valueType,
    value: Number(record.value),
    targetProductUids: record.targetProductUids,
    containsItemUids: record.containsItemUids,
    minOrderAmount:
      record.minOrderAmount == null ? null : Number(record.minOrderAmount),
    validFrom: record.validFrom?.toISOString() ?? null,
    validUntil: record.validUntil?.toISOString() ?? null,
    maxUses: record.maxUses,
    usedCount: record.usedCount,
  };
}
