import { CartItem } from "@/types/cart";

import {
  isProductDonation,
  isProductExcludedFromRefunds,
  isProductShippable,
} from "@/domain/product/businessLogic";
import { DiscountDetails } from "@/types/checkout";
import { transformPriceFromStripe } from "@/app/services/stripe/util";

export const includesShippableProduct = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductShippable(item));
};
export const includesNonRefundableProduct = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductExcludedFromRefunds(item));
};
export const includesDonationProduct = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductDonation(item));
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

export const isProductInCart = (cartItems: CartItem[], productId: string) => {
  return cartItems.some(item => item.id === productId);
};
