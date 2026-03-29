import {
  isProductCurrency,
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
export const includesCurrencyProduct = (cartItems: CartItem[]) => {
  return cartItems.some(item => isProductCurrency(item));
};
export const isOnlyCurrencyProducts = (cartItems: CartItem[]) => {
  return cartItems.length > 0 && cartItems.every(item => isProductCurrency(item));
};
export const hasMinimumCheckoutValue = (total: number) => {
  return total >= 2;
};

export const MINIMUM_CARD_PAYMENT_CENTS = 100; // 1 EUR minimum for card payments

export const getMaxWalletCredit = (
  totalCents: number,
  walletBalanceCents: number
): number => {
  // If wallet can cover the full amount, allow 100% wallet payment
  if (walletBalanceCents >= totalCents) {
    return totalCents;
  }
  // If partial payment, ensure minimum card payment of 1 EUR
  if (totalCents <= MINIMUM_CARD_PAYMENT_CENTS) {
    return 0; // Can't use wallet if total is already at minimum
  }
  const maxUsable = totalCents - MINIMUM_CARD_PAYMENT_CENTS;
  return Math.min(walletBalanceCents, maxUsable);
};

export const isValidWalletCreditAmount = (
  walletCreditCents: number,
  totalCents: number,
  walletBalanceCents: number
): boolean => {
  if (walletCreditCents <= 0) return true; // Not using wallet is always valid
  if (walletCreditCents > walletBalanceCents) return false; // Can't use more than balance
  if (walletCreditCents > totalCents) return false; // Can't use more than total
  const remainingCents = totalCents - walletCreditCents;
  // Allow full wallet payment (remaining = 0) or minimum card payment
  return remainingCents === 0 || remainingCents >= MINIMUM_CARD_PAYMENT_CENTS;
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
