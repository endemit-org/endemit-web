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
import confetti from "canvas-confetti";
import Link from "next/link";

export default function Checkout() {
  const [isClient, setIsClient] = useState(false);
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
  } = useCheckoutState();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        roundedTotal: 0,
        donationAmount: 0,
      };
  const displayCountry = isClient ? formData.country : "SI";

  return (
    <>
      <CheckoutError error={error} />
      <div className="flex gap-x-6 max-lg:flex-col">
        <div className="bg-neutral-800 p-4 lg:p-6 lg:w-3/5 w-full rounded-md space-y-6">
          {isClient &&
            (!hasItems ? (
              <div className="text-neutral-400 italic text-center h-full  flex flex-col justify-center items-center">
                <div>
                  Your cart is empty.
                  <div className="pt-4">
                    Visit the{" "}
                    <Link href={"/store"} className="link">
                      Endemit store
                    </Link>{" "}
                    to select your products.
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
                  validateForm={validateForm}
                  validationTriggered={validationTriggered}
                />
              </>
            ))}
        </div>
        <div className="lg:w-2/5 w-full pt-6 lg:p-6 min-w-72 max-lg:mt-8 max-lg:mb-12">
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
