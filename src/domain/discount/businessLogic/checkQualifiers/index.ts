import type {
  DiscountCartContext,
  DiscountRule,
} from "@/domain/discount/types/discount";

/**
 * Validates every configured qualifier on a code (all optional, AND-ed) and
 * throws a user-facing error on the first failure. Pure and isomorphic: the
 * server runs it at validation/checkout time, the client re-runs it when the
 * cart changes to drop a code that no longer qualifies.
 *
 * The usage cap is a soft check against the usedCount read at validation
 * time; the authoritative increment happens atomically when an order is paid.
 */
export function checkQualifiers(
  rule: DiscountRule,
  { items, subTotal, shippingCost }: DiscountCartContext,
  now: Date = new Date()
): void {
  if (rule.validFrom && now < new Date(rule.validFrom)) {
    throw new Error("Promo code is not active yet");
  }
  if (rule.validUntil && now > new Date(rule.validUntil)) {
    throw new Error("Promo code has expired");
  }
  if (rule.maxUses != null && rule.usedCount >= rule.maxUses) {
    throw new Error("Promo code has reached maximum redemptions");
  }

  const base = subTotal + shippingCost;
  if (rule.minOrderAmount != null && base < rule.minOrderAmount) {
    throw new Error(
      `Minimum order amount of €${rule.minOrderAmount} required`
    );
  }

  const cartUids = new Set(items.map(item => item.uid));
  if (
    rule.containsItemUids.length > 0 &&
    !rule.containsItemUids.some(uid => cartUids.has(uid))
  ) {
    throw new Error("Promo code requires a specific item in your cart");
  }

  // ITEM codes implicitly require their target item — a discount on nothing
  // is a qualification failure, not a €0 discount.
  if (
    rule.type === "ITEM" &&
    !rule.targetProductUids.some(uid => cartUids.has(uid))
  ) {
    throw new Error(
      "The item this promo code applies to is not in your cart"
    );
  }
}

/** Non-throwing variant for client-side revalidation effects. */
export function isQualified(
  rule: DiscountRule,
  context: DiscountCartContext,
  now: Date = new Date()
): boolean {
  try {
    checkQualifiers(rule, context, now);
    return true;
  } catch {
    return false;
  }
}
