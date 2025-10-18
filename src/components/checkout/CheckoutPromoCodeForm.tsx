"use client";

import { DiscountDetails } from "@/domain/checkout/types/checkout";
import Input from "@/components/form/Input";
import ActionButton from "@/components/form/ActionButton";

interface CheckoutPromoCodeFormProps {
  discount: DiscountDetails | undefined;
  promoCodeValue: string;
  onPromoCodeChange: (value: string) => void;
  onApplyPromoCode: () => void;
  onRemovePromoCode: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export default function CheckoutPromoCodeForm({
  discount,
  promoCodeValue,
  onPromoCodeChange,
  onApplyPromoCode,
  onRemovePromoCode,
  isLoading,
  errorMessage,
}: CheckoutPromoCodeFormProps) {
  // Show applied state
  if (discount?.success) {
    return (
      <div className="flex text-sm justify-between mb-12">
        <span className="text-neutral-400">
          Promo code <strong>{discount.promoCodeKey}</strong> applied
        </span>{" "}
        <div onClick={onRemovePromoCode} className="text-neutral-400 link">
          Remove
        </div>
      </div>
    );
  }

  // Show input form
  return (
    <div className="mb-4">
      <div className="flex gap-2 justify-between items-start ">
        <div className="flex-1 pb-3">
          <Input
            name="promoCode"
            type="text"
            value={promoCodeValue}
            onChange={(name, value) => onPromoCodeChange(value)}
            placeholder="Enter promo code"
            disabled={isLoading}
          />
        </div>
        <div>
          <ActionButton
            onClick={onApplyPromoCode}
            // disabled={isLoading || !promoCodeValue}
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
