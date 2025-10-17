import { stripe } from "@/services/stripe";
import {
  transformPriceFromStripe,
  transformPriceToStripe,
} from "@/services/stripe/util";

export const validatePromoCode = async (
  promoCode: string,
  subtotal: number
) => {
  const promoCodes = await stripe.promotionCodes.list({
    code: promoCode,
    active: true,
    limit: 1,
  });

  if (promoCodes.data.length === 0) throw new Error("Invalid promo code");

  const foundPromoCode = promoCodes.data[0];
  const coupon = foundPromoCode.coupon;

  const minimumAmount = foundPromoCode.restrictions?.minimum_amount;
  if (!minimumAmount || transformPriceToStripe(subtotal) < minimumAmount) {
    throw new Error(
      `Minimum order amount of €${transformPriceFromStripe(minimumAmount!)} required`
    );
  }

  if (
    foundPromoCode.max_redemptions &&
    foundPromoCode.times_redeemed > foundPromoCode.max_redemptions
  ) {
    throw new Error("Promo code has reached maximum redemptions");
  }

  return { coupon, foundPromoCode };
};
