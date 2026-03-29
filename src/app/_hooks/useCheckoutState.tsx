"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCart, useCartStore } from "@/app/_stores/CartStore";
import { useCheckoutForm } from "@/app/_hooks/useCheckoutForm";
import { useShippingCost } from "@/app/_hooks/useShippingCost";
import { usePromoCodes } from "@/app/_hooks/usePromoCodes";
import { useNewsletterSubscription } from "@/app/_hooks/useNewsletterSubscription";
import { useWalletCredit } from "@/app/_hooks/useWalletCredit";
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
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

export interface PaymentState {
  clientSecret: string | null;
  orderId: string | null;
  isReady: boolean;
}

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
    incrementItem,
    decrementItem,
    clearCart,
    checkout,
    isLoading: isCheckoutLoading,
  } = useCart();

  const initPayment = useCartStore(state => state.initPayment);
  const createPaymentIntent = useCartStore(state => state.createPaymentIntent);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [validationTriggered, setValidationTriggered] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>({
    clientSecret: null,
    orderId: null,
    isReady: false,
  });
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isFullWalletPayment, setIsFullWalletPayment] = useState(false);

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

  const { subTotal, total: totalBeforeWallet, discountAmount } = useCheckoutTotals(
    subtotalPrice,
    shippingCost,
    discount
  );

  // Wallet credit integration
  const walletCredit = useWalletCredit({
    total: totalBeforeWallet,
    enabled: items.length > 0,
  });

  // Final total after wallet credit
  const total = totalBeforeWallet - walletCredit.walletCreditEur;

  const { roundedTotal, donationAmount, showDonation } =
    useDonationCalculations(totalBeforeWallet, items, includesDonationInCart);

  const consolidatedError = transformToConsolidatedCheckoutErrors([
    checkoutError,
    shippingError,
    promoError,
  ]);

  const isProcessing = isCheckoutLoading || isLoadingShipping || isLoadingPromo || walletCredit.isLoading || isCreatingPayment || isInitializingPayment;
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

  // Initialize payment (get clientSecret for card form)
  const handleInitPayment = useCallback(async () => {
    if (items.length === 0 || paymentState.isReady || isInitializingPayment) return;

    setIsInitializingPayment(true);
    setCheckoutError(null);

    try {
      const result = await initPayment({
        country: formData.country,
        promoCode: promoCodeValue || undefined,
        walletCreditAmount: walletCredit.walletCreditAmount,
      });

      if (result.fullWalletPayment) {
        setIsFullWalletPayment(true);
        return;
      }

      if (result.clientSecret && result.paymentIntentId) {
        setPaymentIntentId(result.paymentIntentId);
        setPaymentState({
          clientSecret: result.clientSecret,
          orderId: null, // Order not created yet
          isReady: true,
        });
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Failed to initialize payment");
    } finally {
      setIsInitializingPayment(false);
    }
  }, [
    items.length,
    paymentState.isReady,
    isInitializingPayment,
    formData.country,
    promoCodeValue,
    walletCredit.walletCreditAmount,
    initPayment,
  ]);

  // Confirm payment (validate form, create order, then frontend confirms with Stripe)
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
        paymentIntentId: paymentIntentId || undefined,
      });

      if (result.fullWalletPayment) {
        // Full wallet payment - order is already completed, redirect to success
        clearCart();
        window.location.href = `${PUBLIC_BASE_WEB_URL}/store/checkout/success/${result.orderId}`;
        return { success: true, fullWalletPayment: true };
      }

      // Update payment state with order ID
      setPaymentState(prev => ({
        ...prev,
        orderId: result.orderId,
      }));

      return { success: true, orderId: result.orderId };
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
    paymentIntentId,
    createPaymentIntent,
    validateForm,
    items.length,
    clearCart,
  ]);

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      clientSecret: null,
      orderId: null,
      isReady: false,
    });
    setPaymentIntentId(null);
    setIsFullWalletPayment(false);
  }, []);

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
    walletCredit: {
      balance: walletCredit.walletBalance,
      creditAmount: walletCredit.walletCreditAmount,
      maxCredit: walletCredit.maxWalletCredit,
      remainingToPay: walletCredit.remainingToPay,
      isLoading: walletCredit.isLoading,
      canUse: walletCredit.canUseWallet,
      isUsing: walletCredit.isUsingWallet,
    },
    // Payment state for inline Stripe Elements
    payment: {
      clientSecret: paymentState.clientSecret,
      orderId: paymentState.orderId,
      isReady: paymentState.isReady,
      isInitializing: isInitializingPayment,
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
      initPayment: handleInitPayment,
      confirmPayment: handleConfirmPayment,
      resetPaymentState,
      setWalletCreditAmount: walletCredit.setWalletCreditAmount,
      toggleWalletCredit: walletCredit.toggleWalletCredit,
    },
  };
}
