"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart, useCartStore } from "@/app/_stores/CartStore";
import { useCheckoutForm } from "@/app/_hooks/useCheckoutForm";
import { useShippingCost } from "@/app/_hooks/useShippingCost";
import { usePromoCodes } from "@/app/_hooks/usePromoCodes";
import { useWalletCredit } from "@/app/_hooks/useWalletCredit";
import {
  canProceedToCheckout,
  includesCurrencyProduct,
  includesDonationProduct,
  includesNonRefundableProduct,
  includesShippableProduct,
  isOnlyCurrencyProducts,
  shouldShowDonationCTA,
} from "@/domain/checkout/businessRules";
import { getCheckoutWeight } from "@/domain/checkout/actions/getCheckoutWeight";
import { getCheckoutTotals } from "@/domain/checkout/actions/getCheckoutTotals";
import { getSuggestedDonationAmount } from "@/domain/checkout/actions/getSuggestedDonationAmount";
import { getRoundedUpTotal } from "@/domain/checkout/actions/getRoundedUpTotal";
import { transformToConsolidatedCheckoutErrors } from "@/domain/checkout/transformers/transformToConsolidatedCheckoutErrors";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import { CartItem } from "@/domain/checkout/types/cartItem";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

function useCheckoutRequirements(items: CartItem[]) {
  return useMemo(
    () => ({
      requiresShippingAddress: includesShippableProduct(items),
      includesNonRefundable: includesNonRefundableProduct(items),
      includesDonationInCart: includesDonationProduct(items),
      includesCurrency: includesCurrencyProduct(items),
      isOnlyCurrency: isOnlyCurrencyProducts(items),
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
  includesDonationInCart: boolean,
  isOnlyCurrency: boolean
) {
  return useMemo(() => {
    const roundedTotal = getRoundedUpTotal(total);
    const donationAmount = getSuggestedDonationAmount(roundedTotal, total);
    // Don't show donation CTA for currency-only carts (wallet top-ups)
    const showDonation = !isOnlyCurrency && shouldShowDonationCTA(
      items,
      donationAmount,
      includesDonationInCart
    );
    return { roundedTotal, donationAmount, showDonation };
  }, [total, items, includesDonationInCart, isOnlyCurrency]);
}

export function useCheckoutState() {
  const {
    items,
    subtotalPrice,
    totalItems,
    addItem,
    removeItem,
    incrementItem,
    decrementItem,
    clearCart,
    checkout,
    isLoading: isCheckoutLoading,
  } = useCart();

  const createPaymentIntent = useCartStore(state => state.createPaymentIntent);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [validationTriggered, setValidationTriggered] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  const {
    requiresShippingAddress,
    includesNonRefundable,
    includesDonationInCart,
    includesCurrency,
    isOnlyCurrency,
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

  const { subTotal, total: totalBeforeWallet, discountAmount } = useCheckoutTotals(
    subtotalPrice,
    shippingCost,
    discount
  );

  // Wallet credit integration - disabled for currency top-ups
  const walletCredit = useWalletCredit({
    total: totalBeforeWallet,
    enabled: items.length > 0 && !includesCurrency,
  });

  // Final total after wallet credit
  const total = totalBeforeWallet - walletCredit.walletCreditEur;

  const { roundedTotal, donationAmount, showDonation } =
    useDonationCalculations(totalBeforeWallet, items, includesDonationInCart, isOnlyCurrency);

  const consolidatedError = transformToConsolidatedCheckoutErrors([
    checkoutError,
    shippingError,
    promoError,
  ]);

  const isProcessing = isCheckoutLoading || isLoadingShipping || isLoadingPromo || walletCredit.isLoading || isCreatingPayment;
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
      await checkout({
        formData,
        walletCreditAmount: walletCredit.walletCreditAmount,
      });
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout failed");
    }
  };

  // Create order and PaymentIntent, return clientSecret for Stripe confirmation
  const handleConfirmPayment = useCallback(async () => {
    setCheckoutError(null);
    const isValid = validateForm("manual");

    if (!isValid || items.length === 0) {
      return { success: false };
    }

    setIsCreatingPayment(true);

    try {
      const result = await createPaymentIntent({
        formData,
        walletCreditAmount: walletCredit.walletCreditAmount,
        promoCode: promoCodeValue || undefined,
      });

      if (result.fullWalletPayment) {
        // Full wallet payment - order is already completed, redirect to success
        clearCart();
        window.location.href = `${PUBLIC_BASE_WEB_URL}/store/checkout/success/${result.orderId}`;
        return { success: true, fullWalletPayment: true };
      }

      return {
        success: true,
        orderId: result.orderId,
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
      };
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Failed to process payment");
      return { success: false };
    } finally {
      setIsCreatingPayment(false);
    }
  }, [
    formData,
    walletCredit.walletCreditAmount,
    promoCodeValue,
    createPaymentIntent,
    validateForm,
    items.length,
    clearCart,
  ]);

  // Check if this is a full wallet payment (no card needed)
  const isFullWalletPayment = useMemo(() => {
    if (!walletCredit.canUseWallet || !walletCredit.isUsingWallet) return false;
    const totalInCents = Math.round(total * 100);
    return walletCredit.walletCreditAmount >= totalInCents;
  }, [walletCredit.canUseWallet, walletCredit.isUsingWallet, walletCredit.walletCreditAmount, total]);

  // Amount to charge via Stripe (in cents)
  const amountToCharge = useMemo(() => {
    const totalInCents = Math.round(total * 100);
    return Math.max(0, totalInCents - walletCredit.walletCreditAmount);
  }, [total, walletCredit.walletCreditAmount]);

  return {
    items,
    totalItems,
    totals: {
      subTotal,
      shippingCost,
      shippingWeight,
      discountAmount,
      totalBeforeWallet,
      total,
      roundedTotal,
      donationAmount,
      walletCreditAmount: walletCredit.walletCreditAmount,
      walletCreditEur: walletCredit.walletCreditEur,
    },
    formData,
    fieldErrors,
    errorMessages,
    isFormValid,
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
    walletCredit: {
      balance: walletCredit.walletBalance,
      creditAmount: walletCredit.walletCreditAmount,
      maxCredit: walletCredit.maxWalletCredit,
      remainingToPay: walletCredit.remainingToPay,
      isLoading: walletCredit.isLoading,
      canUse: walletCredit.canUseWallet,
      isUsing: walletCredit.isUsingWallet,
    },
    // Payment info for deferred Stripe Elements
    payment: {
      amountToCharge,
      isCreating: isCreatingPayment,
      isFullWalletPayment,
    },
    actions: {
      updateField,
      updateTicketField,
      addItem,
      removeItem,
      incrementItem,
      decrementItem,
      clearCart,
      setPromoCodeValue,
      applyPromoCode,
      removePromoCode,
      checkout: handleCheckout,
      confirmPayment: handleConfirmPayment,
      setWalletCreditAmount: walletCredit.setWalletCreditAmount,
      toggleWalletCredit: walletCredit.toggleWalletCredit,
    },
  };
}
