"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useCheckoutState } from "@/app/_hooks/useCheckoutState";
import { useProducts } from "@/app/_stores/ProductStore";
import { isProductSellable } from "@/domain/product/businessLogic";
import { isOnlyCurrencyProducts } from "@/domain/checkout/businessRules";
import CheckoutCustomerForm from "@/app/_components/checkout/CheckoutCustomerForm";
import CheckoutItemList from "@/app/_components/checkout/CheckoutItemList";
import CheckoutPromoCodeForm from "@/app/_components/checkout/CheckoutPromoCodeForm";
import CheckoutDonation from "@/app/_components/checkout/CheckoutDonation";
import CheckoutError from "@/app/_components/checkout/CheckoutError";
import CheckoutSummary from "@/app/_components/checkout/CheckoutSummary";
import CheckoutWalletCredit from "@/app/_components/checkout/CheckoutWalletCredit";
import StripeProvider from "@/app/_components/checkout/StripeProvider";
import PaymentForm from "@/app/_components/checkout/PaymentForm";
import confetti from "canvas-confetti";
import Link from "next/link";
import AnimatedWarningIcon from "@/app/_components/icon/AnimatedWarningIcon";
import ProductSection from "@/app/_components/product/ProductSection";
import CheckoutCashlessTopUp from "@/app/_components/checkout/CheckoutCashlessTopUp";
import { Product, ProductCategory } from "@/domain/product/types/product";
import clsx from "clsx";
import ActionButton from "@/app/_components/form/ActionButton";

type Props = {
  products: Product[] | null;
  currencyProducts?: Product[];
  userEmail?: string;
};

export default function Checkout({
  products,
  currencyProducts = [],
  userEmail,
}: Props) {
  const [isClient, setIsClient] = useState(false);
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
  const [donationDismissed, setDonationDismissed] = useState(false);
  const [paymentError, setPaymentError] = useState<string>("");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentInitialized, setPaymentInitialized] = useState(false);
  const { getProductByUid } = useProducts();

  const {
    items,
    totalItems,
    totals,
    formData,
    errorMessages,
    shouldShowNewsletter,
    discount,
    promoCodeValue,
    showDonation,
    requiresShippingAddress,
    includesNonRefundable,
    isProcessing,
    error,
    canProceed,
    isFormValid,
    actions,
    validateForm,
    validationTriggered,
    walletCredit,
    payment,
  } = useCheckoutState();

  const hasItems = totalItems > 0;

  // Check if cart has tickets for cashless events (hide donations if so)
  const hasCashlessEventTickets = useMemo(() => {
    return items.some(
      item =>
        item.category === ProductCategory.TICKETS &&
        item.relatedEvent?.hasCashlessPayments === true
    );
  }, [items]);

  // Auto-initialize payment when we have items (show card form immediately)
  useEffect(() => {
    if (
      isClient &&
      hasItems &&
      !payment.isReady &&
      !payment.isInitializing &&
      !paymentInitialized
    ) {
      setPaymentInitialized(true);
      actions.initPayment();
    }
  }, [
    isClient,
    hasItems,
    payment.isReady,
    payment.isInitializing,
    paymentInitialized,
    actions,
  ]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Pre-fill email when user is logged in (only once)
  const emailPrefilledRef = useRef(false);
  useEffect(() => {
    if (userEmail && !emailPrefilledRef.current) {
      emailPrefilledRef.current = true;
      actions.updateField("email", userEmail);
      actions.updateField("emailRepeat", userEmail);
    }
  }, [userEmail, actions]);

  // Fast checkout for wallet top-ups: auto-accept terms, skip to step 2, set return URL
  const fastCheckoutInitializedRef = useRef(false);
  useEffect(() => {
    if (
      isClient &&
      hasItems &&
      userEmail &&
      isOnlyCurrencyProducts(items) &&
      !fastCheckoutInitializedRef.current
    ) {
      fastCheckoutInitializedRef.current = true;
      actions.updateField("termsAndConditions", true);
      setMobileStep(2);
      // Ensure return URL is set for wallet top-ups
      if (!localStorage.getItem("checkoutReturnUrl")) {
        localStorage.setItem("checkoutReturnUrl", "/profile");
      }
    }
  }, [isClient, hasItems, userEmail, items, actions]);

  const handleAddDonation = (e: React.MouseEvent) => {
    const donationProduct = getProductByUid("donation-to-association");
    if (donationProduct && isProductSellable(donationProduct).isSellable) {
      actions.addItem(donationProduct, totals.donationAmount);
      confetti({
        particleCount: 50,
        spread: 50,
        origin: {
          x: e.clientX / window.innerWidth,
          y: e.clientY / window.innerHeight,
        },
      });
    }
  };

  const displayTotals = isClient
    ? totals
    : {
        subTotal: 0,
        shippingCost: 0,
        shippingWeight: 0,
        discountAmount: 0,
        total: 0,
        totalBeforeWallet: 0,
        roundedTotal: 0,
        donationAmount: 0,
        walletCreditAmount: 0,
        walletCreditEur: 0,
      };
  const displayCountry = isClient ? formData.country : "SI";

  const handleNextStep = () => {
    validateForm("manual");
    if (!isFormValid) return;
    setMobileStep(2);
    // Scroll to top on mobile when moving to step 2
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackStep = () => {
    setMobileStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const PaymentFormComponent = () => {
    return (
      <>
        {payment.isReady && payment.clientSecret ? (
          <StripeProvider clientSecret={payment.clientSecret}>
            <PaymentForm
              totalAmount={totals.total}
              isProcessing={isPaymentProcessing}
              onProcessingChange={setIsPaymentProcessing}
              onError={setPaymentError}
              canProceed={canProceed}
              onConfirmPayment={actions.confirmPayment}
            />
          </StripeProvider>
        ) : payment.isFullWalletPayment ? (
          <div className="mt-4">
            <ActionButton
              onClick={async () => {
                const result = await actions.confirmPayment();
                if (!result.success) {
                  setPaymentError("Failed to process payment");
                }
              }}
              disabled={!canProceed || isProcessing}
              variant="success"
              className="py-3 text-lg"
            >
              {isProcessing
                ? "Processing..."
                : "Complete Order (Wallet Payment)"}
            </ActionButton>
          </div>
        ) : (
          <div className="mt-4 py-6 text-center">
            {payment.isInitializing ? (
              <div className="text-neutral-400 text-sm">
                Loading payment form...
              </div>
            ) : (
              <div className="text-neutral-400 text-sm">
                Preparing secure payment...
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <CheckoutError error={error} />
      <div className="flex gap-x-6 max-lg:flex-col">
        {/* Step 1: Customer Information (always visible on desktop, step 1 on mobile) */}
        <div
          className={clsx(
            "bg-neutral-800 p-4 lg:p-6 lg:w-3/5 w-full rounded-md space-y-6",
            mobileStep !== 1 && "max-lg:hidden"
          )}
        >
          {isClient &&
            (!hasItems ? (
              <div className="text-neutral-400 italic text-center h-full  flex flex-col justify-center items-center">
                <div>
                  <div
                    className={
                      "flex flex-col justify-center items-center mb-6 text-neutral-400"
                    }
                  >
                    <AnimatedWarningIcon color="currentColor" />
                  </div>
                  Your cart is empty.
                  <div className="pt-4">
                    Visit{" "}
                    <Link href={"/store"} className="link">
                      our Merch section
                    </Link>{" "}
                    to select products for your purchase and support our
                    non-profit work.
                  </div>
                </div>
              </div>
            ) : (
              <>
                <CheckoutCustomerForm
                  formData={formData}
                  errorMessages={errorMessages}
                  onFormChangeAction={actions.updateField}
                  onTicketFormChange={actions.updateTicketField}
                  onIncrementItem={actions.incrementItem}
                  onDecrementItem={actions.decrementItem}
                  onRemoveItem={actions.removeItem}
                  requiresShippingAddress={requiresShippingAddress}
                  includesNonRefundable={includesNonRefundable}
                  showSubscribeToNewsletter={shouldShowNewsletter}
                  items={items}
                  submitForm={actions.checkout}
                  validateForm={validateForm}
                  validationTriggered={validationTriggered}
                  userEmail={userEmail}
                />

                {/* Mobile: Next button to go to step 2 */}
                <div className="lg:hidden pt-4">
                  <button
                    onClick={handleNextStep}
                    disabled={!isFormValid}
                    className={clsx(
                      "w-full font-medium py-3 px-6 rounded-lg transition-colors",
                      isFormValid
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-neutral-600 text-neutral-400 cursor-not-allowed"
                    )}
                  >
                    Continue to Review & Pay
                  </button>
                </div>
              </>
            ))}
        </div>

        {/* Step 2: Cart & Payment (always visible on desktop, step 2 on mobile) */}
        <div
          className={clsx(
            "lg:w-2/5 w-full lg:p-6 min-w-72 max-lg:mb-12",
            mobileStep !== 2 && "max-lg:hidden"
          )}
        >
          {isClient && (
            <>
              <h3 className="text-2xl font-medium font-heading mb-3 text-neutral-200">
                Cart ({totalItems} items)
              </h3>

              <CheckoutItemList
                items={items}
                onRemoveItem={actions.removeItem}
                country={formData?.country}
                editable={!isPaymentProcessing}
              />

              <CheckoutCashlessTopUp
                items={items}
                currencyProducts={currencyProducts}
                onAddTopUp={product => actions.addItem(product, 1)}
                disabled={isPaymentProcessing}
              />

              {showDonation &&
                !donationDismissed &&
                !walletCredit.isLoading &&
                !walletCredit.canUse &&
                !hasCashlessEventTickets && (
                  <CheckoutDonation
                    donationAmount={displayTotals.donationAmount}
                    roundedTotal={displayTotals.roundedTotal}
                    onAddDonation={handleAddDonation}
                    onDismiss={() => setDonationDismissed(true)}
                    disabled={isPaymentProcessing}
                  />
                )}

              <CheckoutSummary
                subTotal={displayTotals.subTotal}
                shippingCost={displayTotals.shippingCost}
                discountObject={discount}
                discountAmount={displayTotals.discountAmount}
                total={displayTotals.total}
                walletCreditEur={displayTotals.walletCreditEur}
                orderWeight={displayTotals.shippingWeight}
                country={displayCountry}
                loadingShippingCost={isProcessing}
                loadingPromoCode={isProcessing}
              />

              {hasItems && (
                <CheckoutPromoCodeForm
                  discount={discount}
                  promoCodeValue={promoCodeValue}
                  onPromoCodeChangeAction={actions.setPromoCodeValue}
                  onApplyPromoCodeAction={actions.applyPromoCode}
                  onRemovePromoCodeAction={actions.removePromoCode}
                  isLoading={isProcessing}
                  disabled={isPaymentProcessing}
                />
              )}

              {hasItems && (
                <div className="mt-4">
                  <CheckoutWalletCredit
                    walletBalance={walletCredit.balance}
                    walletCreditAmount={walletCredit.creditAmount}
                    maxWalletCredit={walletCredit.maxCredit}
                    remainingToPay={walletCredit.remainingToPay}
                    isLoading={walletCredit.isLoading}
                    canUseWallet={walletCredit.canUse}
                    isUsingWallet={walletCredit.isUsing}
                    onToggle={actions.toggleWalletCredit}
                    onAmountChange={actions.setWalletCreditAmount}
                    disabled={isPaymentProcessing}
                  />
                </div>
              )}

              {/* Mobile: Show message when form becomes invalid */}
              {!isFormValid && (
                <div className="lg:hidden mb-4 p-3 bg-amber-900/30 border border-amber-700/40 rounded text-center">
                  <p className="text-sm text-amber-200">
                    Please go back to update ticket holder information.
                  </p>
                  <button
                    onClick={handleBackStep}
                    className="mt-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors"
                  >
                    ← Back to Information
                  </button>
                </div>
              )}

              {/* Payment Section */}
              {paymentError && (
                <div className="mb-4 p-3 bg-red-900/30 border border-red-700/40 rounded">
                  <p className="text-sm text-red-200">{paymentError}</p>
                </div>
              )}

              {hasItems ? <PaymentFormComponent /> : null}

              {/* Mobile: Back link to go to step 1 */}
              {isFormValid && (
                <div className="lg:hidden mt-4 text-center">
                  <button
                    onClick={handleBackStep}
                    className="text-neutral-400 hover:text-white text-sm transition-colors"
                  >
                    ← Back to Information
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {!hasItems && products && (
        <ProductSection
          products={products}
          title={"Official items"}
          description={
            "These are official endemit items you can add to your checkout. Explore and add to your cart."
          }
        />
      )}
    </>
  );
}
