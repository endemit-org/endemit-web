// @/hooks/usePromoCodes.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import { getApiPath } from "@/lib/api";
import { DiscountDetails } from "@/types/checkout";
import { isPromoCodeValid } from "@/domain/checkout/businessRules";

interface UsePromoCodesReturn {
  discount: DiscountDetails | undefined;
  promoCodeValue: string;
  isLoading: boolean;
  error: string | null;
  setPromoCodeValue: (value: string) => void;
  applyPromoCode: () => Promise<void>;
  removePromoCode: () => void;
}

export function usePromoCodes(
  subtotal: number,
  shippingCost: number
): UsePromoCodesReturn {
  const [discount, setDiscount] = useState<DiscountDetails | undefined>();
  const [promoCodeValue, setPromoCodeValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseForDiscount = subtotal + shippingCost;

  const applyPromoCode = useCallback(async () => {
    if (!promoCodeValue || baseForDiscount === 0) {
      setError("Invalid promo code or cart amount");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(getApiPath(`checkout/promo-code`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promoCode: promoCodeValue,
          subtotal: baseForDiscount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Promo code validation failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || data.error) {
        throw new Error(data.error);
      }

      setDiscount(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to apply promo code";
      setError(errorMessage);
      setDiscount(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [promoCodeValue, baseForDiscount]);

  const removePromoCode = useCallback(() => {
    setPromoCodeValue("");
    setDiscount(undefined);
    setError(null);
  }, []);

  // Auto-remove promo code if it becomes invalid due to cart changes
  useEffect(() => {
    if (discount && !isPromoCodeValid(discount, baseForDiscount)) {
      removePromoCode();
    }
  }, [baseForDiscount, discount, removePromoCode]);

  return {
    discount,
    promoCodeValue,
    isLoading,
    error,
    setPromoCodeValue,
    applyPromoCode,
    removePromoCode,
  };
}
