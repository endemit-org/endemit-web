import { DiscountDetails } from "@/types/checkout";
import { transformPriceFromStripe } from "@/services/stripe/util";

const getDiscountByAmount = (discountAmount: number) => {
  return discountAmount * -1;
};

const getDiscountByPercent = (discountPercent: number, prevTotal: number) => {
  return Math.round((prevTotal * discountPercent) / 100) * -1;
};

export const getCheckoutTotals = ({
  subTotal,
  discount,
  shippingCost,
}: {
  subTotal: number;
  discount?: DiscountDetails;
  shippingCost: number;
}) => {
  let discountAmount = 0;
  const baseForDiscount = subTotal + shippingCost;

  if (discount && discount?.coupon?.amount_off) {
    discountAmount = getDiscountByAmount(
      transformPriceFromStripe(discount.coupon.amount_off)
    );
  }
  if (discount && discount?.coupon?.percent_off) {
    discountAmount = getDiscountByPercent(
      discount.coupon.percent_off,
      baseForDiscount
    );
  }

  const total = baseForDiscount + discountAmount;

  return {
    subTotal,
    discountAmount,
    shippingCost,
    total,
  };
};
