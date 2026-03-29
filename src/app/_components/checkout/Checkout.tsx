"use client";

import { useState, useEffect } from "react";
import { useCheckoutState } from "@/app/_hooks/useCheckoutState";
import { useProducts } from "@/app/_stores/ProductStore";
import { isProductSellable } from "@/domain/product/businessLogic";
import CheckoutCustomerForm from "@/app/_components/checkout/CheckoutCustomerForm";
import CheckoutItemList from "@/app/_components/checkout/CheckoutItemList";
import CheckoutPromoCodeForm from "@/app/_components/checkout/CheckoutPromoCodeForm";
import CheckoutDonation from "@/app/_components/checkout/CheckoutDonation";
import CheckoutError from "@/app/_components/checkout/CheckoutError";
import CheckoutActions from "@/app/_components/checkout/CheckoutActions";
import CheckoutSummary from "@/app/_components/checkout/CheckoutSummary";
import CheckoutWalletCredit from "@/app/_components/checkout/CheckoutWalletCredit";
import confetti from "canvas-confetti";
import Link from "next/link";
import AnimatedWarningIcon from "@/app/_components/icon/AnimatedWarningIcon";
import ProductSection from "@/app/_components/product/ProductSection";
import { Product } from "@/domain/product/types/product";
import clsx from "clsx";

type Props = {
  products: Product[] | null;
  userEmail?: string;
};

export default function Checkout({ products, userEmail }: Props) {
  const [isClient, setIsClient] = useState(false);
  const [mobileStep, setMobileStep] = useState<1 | 2>(1);
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
    actions,
    validateForm,
    validationTriggered,
    walletCredit,
  } = useCheckoutState();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Pre-fill email when user is logged in
  useEffect(() => {
    if (userEmail) {
      actions.updateField("email", userEmail);
      actions.updateField("emailRepeat", userEmail);
    }
  }, [userEmail, actions]);

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

  const hasItems = totalItems > 0;

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
    setMobileStep(2);
    // Scroll to top on mobile when moving to step 2
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackStep = () => {
    setMobileStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                      our Endemit Store
                    </Link>{" "}
                    to select products for your purchase or view our trending
                    items below.
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
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
                editable={true}
              />

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
                  />
                </div>
              )}

              {showDonation && (
                <CheckoutDonation
                  donationAmount={displayTotals.donationAmount}
                  roundedTotal={displayTotals.roundedTotal}
                  onAddDonation={handleAddDonation}
                />
              )}
              <CheckoutActions
                errorMessages={errorMessages}
                onCheckout={actions.checkout}
                canProceed={canProceed}
                isProcessing={isProcessing}
              />

              {/* Mobile: Back link to go to step 1 */}
              <div className="lg:hidden mt-4 text-center">
                <button
                  onClick={handleBackStep}
                  className="text-neutral-400 hover:text-white text-sm transition-colors"
                >
                  ← Back to Information
                </button>
              </div>
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
