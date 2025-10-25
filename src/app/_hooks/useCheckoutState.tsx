"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/app/_stores/CartStore";
import { useCheckoutForm } from "@/app/_hooks/useCheckoutForm";
import { useShippingCost } from "@/app/_hooks/useShippingCost";
import { usePromoCodes } from "@/app/_hooks/usePromoCodes";
import { useNewsletterSubscription } from "@/app/_hooks/useNewsletterSubscription";
import {
  canProceedToCheckout,
  includesDonationProduct,
  includesNonRefundableProduct,
  includesShippableProduct,
  shouldShowDonationCTA,
} from "@/domain/checkout/businessRules";
import { getCheckoutWeight } from "@/domain/checkout/actions/getCheckoutWeight";
import { getCheckoutTotals } from "@/domain/checkout/actions/getCheckoutTotals";
import { getSuggestedDonationAmount } from "@/domain/checkout/actions/getSuggestedDonationAmount";
import { getRoundedUpTotal } from "@/domain/checkout/actions/getRoundedUpTotal";
import { transformToConsolidatedCheckoutErrors } from "@/domain/checkout/transformers/transformToConsolidatedCheckoutErrors";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import { CartItem } from "@/domain/checkout/types/cartItem";

function useCheckoutRequirements(items: CartItem[]) {
  return useMemo(
    () => ({
      requiresShippingAddress: includesShippableProduct(items),
      includesNonRefundable: includesNonRefundableProduct(items),
      includesDonationInCart: includesDonationProduct(items),
      orderWeight: getCheckoutWeight(items),
    }),
    [items]
  );
}

function useCheckoutTotals(
  subtotalPrice: number,
  shippingCost: number,
  discount?: DiscountDetails
) {
  return useMemo(
    () =>
      getCheckoutTotals({
        subTotal: subtotalPrice,
        shippingCost,
        discount,
      }),
    [subtotalPrice, shippingCost, discount]
  );
}

function useDonationCalculations(
  total: number,
  items: CartItem[],
  includesDonationInCart: boolean
) {
  return useMemo(() => {
    const roundedTotal = getRoundedUpTotal(total);
    const donationAmount = getSuggestedDonationAmount(roundedTotal, total);
    const showDonation = shouldShowDonationCTA(
      items,
      donationAmount,
      includesDonationInCart
    );
    return { roundedTotal, donationAmount, showDonation };
  }, [total, items, includesDonationInCart]);
}

export function useCheckoutState() {
  const {
    items,
    subtotalPrice,
    totalItems,
    addItem,
    removeItem,
    clearCart,
    checkout,
    isLoading: isCheckoutLoading,
  } = useCart();

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [validationTriggered, setValidationTriggered] = useState(false);

  const {
    requiresShippingAddress,
    includesNonRefundable,
    includesDonationInCart,
    orderWeight,
  } = useCheckoutRequirements(items);

  const {
    formData,
    fieldErrors,
    errorMessages,
    isFormValid,
    updateField,
    updateTicketField,
    validateForm,
  } = useCheckoutForm(requiresShippingAddress, items, setValidationTriggered);

  const emailIsValid =
    fieldErrors !== null && !fieldErrors.email && !fieldErrors.emailRepeat;
  const { shouldShowNewsletter } = useNewsletterSubscription(
    formData.email,
    emailIsValid
  );

  const {
    shippingCost,
    shippingWeight,
    isLoading: isLoadingShipping,
    error: shippingError,
  } = useShippingCost(formData.country, orderWeight, requiresShippingAddress);

  const {
    discount,
    promoCodeValue,
    isLoading: isLoadingPromo,
    error: promoError,
    setPromoCodeValue,
    applyPromoCode,
    removePromoCode,
  } = usePromoCodes(subtotalPrice, shippingCost);

  useEffect(() => {
    const discountCodeId = discount?.success ? discount.promoCodeId : undefined;
    updateField("discountCodeId", discountCodeId);
  }, [discount?.success, discount?.promoCodeId, updateField]);

  const { subTotal, total, discountAmount } = useCheckoutTotals(
    subtotalPrice,
    shippingCost,
    discount
  );

  const { roundedTotal, donationAmount, showDonation } =
    useDonationCalculations(total, items, includesDonationInCart);

  const consolidatedError = transformToConsolidatedCheckoutErrors([
    checkoutError,
    shippingError,
    promoError,
  ]);

  const isProcessing = isCheckoutLoading || isLoadingShipping || isLoadingPromo;
  const canProceed = canProceedToCheckout(
    isFormValid,
    items.length > 0,
    isProcessing
  );

  const handleCheckout = async () => {
    setCheckoutError(null);
    validateForm("manual");

    if (!canProceed) return;

    try {
      await checkout(formData);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
    }
  };

  return {
    items,
    totalItems,
    totals: {
      subTotal,
      shippingCost,
      shippingWeight,
      discountAmount,
      total,
      roundedTotal,
      donationAmount,
    },
    formData,
    fieldErrors,
    errorMessages,
    isFormValid,
    shouldShowNewsletter,
    validateForm,
    validationTriggered,
    discount,
    promoCodeValue,
    showDonation,
    requiresShippingAddress,
    includesNonRefundable,
    isProcessing,
    error: consolidatedError,
    canProceed,
    actions: {
      updateField,
      updateTicketField,
      addItem,
      removeItem,
      clearCart,
      setPromoCodeValue,
      applyPromoCode,
      removePromoCode,
      checkout: handleCheckout,
    },
  };
}
