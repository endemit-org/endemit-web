import type {
  DiscountCartItem,
  DiscountRule,
} from "@/domain/discount/types/discount";

const roundToCents = (value: number) => Math.round(value * 100) / 100;

/**
 * Computes the discount amount in € (positive number) for a rule against a
 * cart. Pure and isomorphic — the checkout client re-runs it on cart changes
 * and the server runs it for the authoritative total.
 *
 * CART rules discount the whole order (base = subtotal + shipping).
 * ITEM rules discount only the cart lines matching targetProductUids:
 * percentage of the matching lines' subtotal, or an absolute € amount per
 * matching unit. Either way the discount never exceeds its base.
 */
export function evaluateDiscount(
  rule: DiscountRule,
  items: DiscountCartItem[],
  subTotal: number,
  shippingCost: number
): number {
  if (rule.type === "CART") {
    const base = subTotal + shippingCost;
    const amount =
      rule.valueType === "ABSOLUTE"
        ? rule.value
        : (base * rule.value) / 100;
    return roundToCents(Math.max(0, Math.min(amount, base)));
  }

  const matching = items.filter(item =>
    rule.targetProductUids.includes(item.uid)
  );
  const matchingSubtotal = matching.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const matchingUnits = matching.reduce((sum, item) => sum + item.quantity, 0);
  const amount =
    rule.valueType === "ABSOLUTE"
      ? rule.value * matchingUnits
      : (matchingSubtotal * rule.value) / 100;
  return roundToCents(Math.max(0, Math.min(amount, matchingSubtotal)));
}
