"use client";

import { useState, useEffect, useMemo } from "react";
import { useCart } from "@/stores/CartStore";
import { useCheckoutForm } from "@/hooks/useCheckoutForm";
import { useShippingCost } from "@/hooks/useShippingCost";
import { usePromoCodes } from "@/hooks/usePromoCodes";
import { useNewsletterSubscription } from "@/hooks/useNewsletterSubscription";
import {
  canProceedToCheckout,
  includesDonationProduct,
  includesNonRefundableProduct,
  includesShippableProduct,
  shouldShowDonationCTA,
} from "@/domain/checkout/businessRules";
import {
  getCheckoutWeight,
  getCheckoutTotals,
  getRoundedUpTotal,
  getSuggestedDonationAmount,
  consolidateCheckoutErrors,
} from "@/domain/checkout/actions";

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

  // Derive checkout requirements
  const requiresShippingAddress = includesShippableProduct(items);
  const includesNonRefundable = includesNonRefundableProduct(items);
  const includesDonationInCart = includesDonationProduct(items);
  const orderWeight = getCheckoutWeight(items);

  // Form management
  const {
    formData,
    fieldErrors,
    errorMessages,
    isFormValid,
    updateField,
    updateTicketField,
    validateForm,
  } = useCheckoutForm(requiresShippingAddress, items, setValidationTriggered);

  // Newsletter subscription check
  const emailIsValid =
    fieldErrors !== null && !fieldErrors.email && !fieldErrors.emailRepeat;
  const { shouldShowNewsletter } = useNewsletterSubscription(
    formData.email,
    emailIsValid
  );

  // Shipping calculation
  const {
    shippingCost,
    shippingWeight,
    isLoading: isLoadingShipping,
    error: shippingError,
  } = useShippingCost(formData.country, orderWeight, requiresShippingAddress);

  // Promo codes
  const {
    discount,
    promoCodeValue,
    isLoading: isLoadingPromo,
    error: promoError,
    setPromoCodeValue,
    applyPromoCode,
    removePromoCode,
  } = usePromoCodes(subtotalPrice, shippingCost);

  // Sync discount ID to form
  useEffect(() => {
    if (discount?.success) {
      updateField("discountCodeId", discount.promoCodeId);
    } else {
      updateField("discountCodeId", undefined);
    }
  }, [discount?.success, discount?.promoCodeId, updateField]);

  // Calculate totals
  const { subTotal, total, discountAmount } = useMemo(
    () =>
      getCheckoutTotals({
        subTotal: subtotalPrice,
        shippingCost,
        discount,
      }),
    [subtotalPrice, shippingCost, discount]
  );

  // Donation calculations
  const roundedTotal = getRoundedUpTotal(total);
  const donationAmount = getSuggestedDonationAmount(roundedTotal, total);
  const showDonation = shouldShowDonationCTA(
    items,
    donationAmount,
    includesDonationInCart
  );

  // Consolidate all errors
  const consolidatedError = consolidateCheckoutErrors([
    checkoutError,
    shippingError,
    promoError,
  ]);

  // Loading states
  const isProcessing = isCheckoutLoading || isLoadingShipping || isLoadingPromo;

  // Can proceed to checkout
  const canProceed = canProceedToCheckout(
    isFormValid,
    items.length > 0,
    isProcessing
  );

  // Checkout action
  const handleCheckout = async () => {
    setCheckoutError(null);
    validateForm("manual");

    if (canProceed) {
      try {
        await checkout(formData);
      } catch (err) {
        setCheckoutError(
          err instanceof Error ? err.message : "Checkout failed"
        );
      }
    }
  };

  return {
    // Cart data
    items,
    totalItems,

    // Totals
    totals: {
      subTotal,
      shippingCost,
      shippingWeight,
      discountAmount,
      total,
      roundedTotal,
      donationAmount,
    },

    // Form
    formData,
    fieldErrors,
    errorMessages,
    isFormValid,
    shouldShowNewsletter,
    validateForm,
    validationTriggered,

    // Promo codes
    discount,
    promoCodeValue,

    // Donation
    showDonation,

    // Requirements
    requiresShippingAddress,
    includesNonRefundable,

    // Loading & errors
    isProcessing,
    error: consolidatedError,
    canProceed,

    // Actions
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
