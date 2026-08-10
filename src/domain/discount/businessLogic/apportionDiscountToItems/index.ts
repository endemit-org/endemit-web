import type {
  DiscountCartItem,
  DiscountRule,
} from "@/domain/discount/types/discount";

const roundToCents = (value: number) => Math.round(value * 100) / 100;

/**
 * Distributes an order's evaluated discount onto per-unit paid prices, so
 * items (tickets especially) can carry the price the customer actually paid
 * rather than the listed price.
 *
 * ITEM rules: only the matching lines share the discount, proportional to
 * each line's subtotal. CART rules: every line shares it, with the share
 * denominator including shipping — shipping silently absorbs its fraction,
 * so items are not over-discounted.
 *
 * Per-unit prices are rounded to cents, so line sums can drift from the
 * order's discountAmount by a cent; the order totals stay authoritative.
 *
 * Returns a map of product uid → discounted unit price in €.
 */
export function apportionDiscountToItems(
  rule: DiscountRule,
  items: DiscountCartItem[],
  subTotal: number,
  shippingCost: number,
  totalDiscount: number
): Map<string, number> {
  const eligible =
    rule.type === "ITEM"
      ? items.filter(item => rule.targetProductUids.includes(item.uid))
      : items;
  const eligibleSubtotal = eligible.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shareBase =
    rule.type === "CART" ? subTotal + shippingCost : eligibleSubtotal;

  const paidByUid = new Map<string, number>();
  if (totalDiscount <= 0 || shareBase <= 0) return paidByUid;

  for (const item of eligible) {
    const lineTotal = item.price * item.quantity;
    const lineShare = (totalDiscount * lineTotal) / shareBase;
    const paidUnit = roundToCents(item.price - lineShare / item.quantity);
    paidByUid.set(item.uid, Math.max(0, paidUnit));
  }
  return paidByUid;
}
