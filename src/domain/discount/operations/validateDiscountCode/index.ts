import "server-only";

import { prisma } from "@/lib/services/prisma";
import { checkQualifiers } from "@/domain/discount/businessLogic/checkQualifiers";
import { evaluateDiscount } from "@/domain/discount/businessLogic/evaluateDiscount";
import { transformDiscountCodeToRule } from "@/domain/discount/transformers/transformDiscountCodeToRule";
import type {
  DiscountCartContext,
  DiscountRule,
} from "@/domain/discount/types/discount";

/**
 * Looks up an active discount code (case-insensitive), checks all its
 * qualifiers against the cart and returns the rule plus the computed
 * discount amount in €. Throws a user-facing error when invalid.
 */
export async function validateDiscountCode(
  code: string,
  context: DiscountCartContext
): Promise<{ rule: DiscountRule; discountAmount: number }> {
  const record = await prisma.discountCode.findFirst({
    where: {
      code: { equals: code.trim(), mode: "insensitive" },
      status: "ACTIVE",
    },
  });

  if (!record) {
    throw new Error("Invalid promo code");
  }

  const rule = transformDiscountCodeToRule(record);
  checkQualifiers(rule, context);
  const discountAmount = evaluateDiscount(
    rule,
    context.items,
    context.subTotal,
    context.shippingCost
  );

  return { rule, discountAmount };
}
