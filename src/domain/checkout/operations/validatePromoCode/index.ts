import "server-only";

import { stripe } from "@/lib/services/stripe";
import {
  isValidMinimumAmount,
  isValidRedemptionLimit,
} from "@/domain/checkout/businessRules";

export const validatePromoCode = async (
  promoCode: string,
  subtotal: number
) => {
  const promoCodes = await stripe.promotionCodes.list({
    code: promoCode,
    active: true,
    limit: 1,
  });

  if (promoCodes.data.length === 0) {
    throw new Error("Invalid promo code");
  }

  const foundPromoCode = promoCodes.data[0];

  isValidMinimumAmount(foundPromoCode.restrictions, subtotal);
  isValidRedemptionLimit(foundPromoCode);

  return { coupon: foundPromoCode.coupon, foundPromoCode };
};
