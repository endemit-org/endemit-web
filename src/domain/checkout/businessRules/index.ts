import {
  isProductDonation,
  isProductExcludedFromRefunds,
  isProductShippable,
  isProductTicket,
} from "@/domain/product/businessLogic";
import {
  DiscountDetails,
  ShippingAddress,
} from "@/domain/checkout/types/checkout";
import { transformPriceToStripe } from "@/domain/checkout/transformers/transformPriceToStripe";
import { CartItem } from "@/domain/checkout/types/cartItem";
import Stripe from "stripe";
import { Product } from "@/domain/product/types/product";
import { transformPriceFromStripe } from "@/domain/checkout/transformers/transformPriceFromStripe";

export const includesShippableProduct = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductShippable(item));
};
export const includesNonRefundableProduct = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductExcludedFromRefunds(item));
};
export const includesDonationProduct = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductDonation(item));
};
export const includesTicketProducts = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductTicket(item));
};
export const hasMinimumCheckoutValue = (total: number) => {
  return total >= 2;
};

export const canProceedToCheckout = (
  isFormValid: boolean,
  hasItems: boolean,
  isProcessing: boolean
) => {
  return isFormValid && hasItems && !isProcessing;
};

export const isPromoCodeValid = (
  discount: DiscountDetails | undefined,
  baseAmount: number
) => {
  if (!discount?.promoCodeKey || !discount?.restrictions?.minimum_amount) {
    return true;
  }

  const minimumRequired = transformPriceFromStripe(
    discount.restrictions.minimum_amount
  );
  return baseAmount >= minimumRequired;
};

export const shouldShowDonationCTA = (
  items: CartItem[],
  donationAmount: number,
  includesDonation: boolean
) => {
  return items.length > 0 && !includesDonation && donationAmount > 0;
};

export const isProductInCart = (cartItems: CartItem[], product: Product) => {
  return cartItems.some(item => item.id === product.id);
};

export const shouldAddShippingToCheckout = (
  shouldHaveShippingAddress: boolean,
  shippingAddress: ShippingAddress | undefined,
  checkoutItems: CartItem[]
): shippingAddress is ShippingAddress => {
  if (!shouldHaveShippingAddress) return false;
  if (!shippingAddress) return false;
  return includesShippableProduct(checkoutItems);
};
export const isValidMinimumAmount = (
  restrictions: Stripe.PromotionCode.Restrictions | undefined,
  subtotal: number
) => {
  const minimumAmount = restrictions?.minimum_amount;
  if (!minimumAmount) return;

  if (transformPriceToStripe(subtotal) < minimumAmount) {
    throw new Error(
      `Minimum order amount of €${transformPriceFromStripe(minimumAmount)} required`
    );
  }
};
export const isValidRedemptionLimit = (promoCode: Stripe.PromotionCode) => {
  if (!promoCode.max_redemptions) return;

  if (promoCode.times_redeemed >= promoCode.max_redemptions) {
    throw new Error("Promo code has reached maximum redemptions");
  }
};
