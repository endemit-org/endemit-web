"use client";

import { useState } from "react";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import Input from "@/app/_components/form/Input";
import ActionButton from "@/app/_components/form/ActionButton";

interface CheckoutPromoCodeFormProps {
  discount: DiscountDetails | undefined;
  promoCodeValue: string;
  onPromoCodeChangeAction: (value: string) => void;
  onApplyPromoCodeAction: () => void;
  onRemovePromoCodeAction: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export default function CheckoutPromoCodeForm({
  discount,
  promoCodeValue,
  onPromoCodeChangeAction,
  onApplyPromoCodeAction,
  onRemovePromoCodeAction,
  isLoading,
  errorMessage,
}: CheckoutPromoCodeFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show applied state
  if (discount?.success) {
    return (
      <div className="flex text-sm justify-between mb-4">
        <span className="text-neutral-400">
          Promo code <strong>{discount.promoCodeKey}</strong> applied
        </span>{" "}
        <button
          onClick={onRemovePromoCodeAction}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          Remove
        </button>
      </div>
    );
  }

  // Show collapsed state with link
  if (!isExpanded) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          + Add promo code
        </button>
      </div>
    );
  }

  // Show expanded input form
  return (
    <div className="mb-4">
      <div className="flex gap-2 justify-between items-start">
        <div className="flex-1 pb-3">
          <Input
            name="promoCode"
            type="text"
            value={promoCodeValue}
            onChangeAction={(name, value) => onPromoCodeChangeAction(value)}
            placeholder="Enter promo code"
            disabled={isLoading}
          />
        </div>
        <div>
          <ActionButton
            onClick={onApplyPromoCodeAction}
            variant={"secondary"}
            size={"sm"}
          >
            {isLoading && promoCodeValue ? "Applying..." : "Apply"}
          </ActionButton>
        </div>
      </div>
      {errorMessage && (
        <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
