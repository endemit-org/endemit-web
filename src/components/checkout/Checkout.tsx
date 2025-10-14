"use client";

import { useState, useEffect } from "react";
import { useCheckoutState } from "@/hooks/useCheckoutState";
import { useProducts } from "@/stores/ProductStore";
import { isProductSellable } from "@/domain/product/businessLogic";
import CheckoutCustomerForm from "@/components/checkout/CheckoutCustomerForm";
import CheckoutItemList from "@/components/checkout/CheckoutItemList";
import CheckoutPromoCodeForm from "@/components/checkout/CheckoutPromoCodeForm";
import CheckoutDonation from "@/components/checkout/CheckoutDonation";
import CheckoutActions from "@/components/checkout/CheckoutActions";
import CheckoutError from "@/components/checkout/CheckoutError";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";

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
  } = useCheckoutState();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddDonation = () => {
    const donationProduct = getProductByUid("donation-to-association");
    if (donationProduct && isProductSellable(donationProduct).isSellable) {
      actions.addItem(donationProduct, totals.donationAmount);
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
  const displayItems = isClient ? totalItems : 0;

  return (
    <div className="border border-gray-300 p-4 m-4 rounded-lg bg-white shadow-sm w-full text-black">
      <CheckoutError error={error} />

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
        totalItems={displayItems}
      />

      <CheckoutPromoCodeForm
        discount={discount}
        promoCodeValue={promoCodeValue}
        onPromoCodeChange={actions.setPromoCodeValue}
        onApplyPromoCode={actions.applyPromoCode}
        onRemovePromoCode={actions.removePromoCode}
        isLoading={isProcessing}
      />

      {isClient &&
        (!hasItems ? (
          <p className="text-gray-500 italic">Your cart is empty</p>
        ) : (
          <>
            <CheckoutCustomerForm
              formData={formData}
              errorMessages={errorMessages}
              onFormChange={actions.updateField}
              requiresShippingAddress={requiresShippingAddress}
              includesNonRefundable={includesNonRefundable}
              showSubscribeToNewsletter={shouldShowNewsletter}
              items={items}
            />

            <CheckoutItemList
              items={items}
              onRemoveItem={actions.removeItem}
              formData={formData}
              errorMessages={errorMessages}
              onFormChange={actions.updateTicketField}
              country={formData?.country}
            />

            {showDonation && (
              <CheckoutDonation
                donationAmount={displayTotals.donationAmount}
                roundedTotal={displayTotals.roundedTotal}
                onAddDonation={handleAddDonation}
              />
            )}

            <CheckoutActions
              onCheckout={actions.checkout}
              onClearCart={actions.clearCart}
              canProceed={canProceed}
              isProcessing={isProcessing}
            />
          </>
        ))}
    </div>
  );
}
