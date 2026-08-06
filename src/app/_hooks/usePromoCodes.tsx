"use client";

import { useState, useCallback, useEffect } from "react";
import { getApiPath } from "@/lib/util/api";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import { isQualified } from "@/domain/discount/businessLogic/checkQualifiers";
import type { DiscountCartItem } from "@/domain/discount/types/discount";

interface UsePromoCodesReturn {
  discount: DiscountDetails | undefined;
  promoCodeValue: string;
  isLoading: boolean;
  error: string | null;
  setPromoCodeValue: (value: string) => void;
  applyPromoCode: () => Promise<void>;
  removePromoCode: () => void;
}

async function validatePromoCode(
  code: string,
  items: DiscountCartItem[],
  subtotal: number,
  shippingCost: number
): Promise<DiscountDetails> {
  const response = await fetch(getApiPath(`checkout/promo-code`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ promoCode: code, items, subtotal, shippingCost }),
  });

  if (!response.ok) {
    throw new Error(`Promo code validation failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success || data.error) {
    throw new Error(data.error);
  }

  return data;
}

export function usePromoCodes(
  items: DiscountCartItem[],
  subtotal: number,
  shippingCost: number
): UsePromoCodesReturn {
  const [discount, setDiscount] = useState<DiscountDetails | undefined>();
  const [promoCodeValue, setPromoCodeValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPromoCode = useCallback(async () => {
    if (!promoCodeValue || subtotal + shippingCost === 0) {
      setError("Invalid promo code or cart amount");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await validatePromoCode(
        promoCodeValue,
        items.map(item => ({
          uid: item.uid,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal,
        shippingCost
      );
      setDiscount(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to apply promo code";
      setError(errorMessage);
      setDiscount(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [promoCodeValue, items, subtotal, shippingCost]);

  const removePromoCode = useCallback(() => {
    setPromoCodeValue("");
    setDiscount(undefined);
    setError(null);
  }, []);

  // Drop the applied code when the cart stops qualifying (item removed,
  // min amount no longer met, window closed) — the rule travels with the
  // discount, so this is a pure local re-check, no network round-trip.
  useEffect(() => {
    if (
      discount &&
      !isQualified(discount, { items, subTotal: subtotal, shippingCost })
    ) {
      removePromoCode();
    }
  }, [discount, items, subtotal, shippingCost, removePromoCode]);

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
