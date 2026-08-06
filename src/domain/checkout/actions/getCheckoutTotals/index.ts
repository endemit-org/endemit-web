import { DiscountDetails } from "@/domain/checkout/types/checkout";
import { evaluateDiscount } from "@/domain/discount/businessLogic/evaluateDiscount";
import type { DiscountCartItem } from "@/domain/discount/types/discount";

export const getCheckoutTotals = ({
  subTotal,
  discount,
  shippingCost,
  items = [],
}: {
  subTotal: number;
  discount?: DiscountDetails;
  shippingCost: number;
  /** Cart lines — required for ITEM-type discounts to find matching lines. */
  items?: DiscountCartItem[];
}) => {
  const discountAmount = discount
    ? -evaluateDiscount(discount, items, subTotal, shippingCost)
    : 0;

  const total = subTotal + shippingCost + discountAmount;

  return {
    subTotal,
    discountAmount,
    shippingCost,
    total,
  };
};
