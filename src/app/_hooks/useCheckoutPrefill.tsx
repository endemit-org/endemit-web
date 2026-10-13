"use client";

import { useEffect, useRef, useState } from "react";
import type { Product } from "@/domain/product/types/product";

export interface CheckoutPrefill {
  items: Array<{ product: Product; quantity: number }>;
  discountCode?: string;
  unavailableUids: string[];
}

interface UseCheckoutPrefillParams {
  prefill: CheckoutPrefill | null;
  /** Current cart size, used to detect when the overwrite has landed. */
  totalItems: number;
  clearCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  setPromoCodeValue: (value: string) => void;
  applyPromoCode: () => Promise<void>;
}

/**
 * Applies a shareable pre-filled checkout link to the cart, once.
 *
 * Sequencing matters here. The promo code can only be validated against a
 * cart, since qualification depends on the items and the order total — so the
 * code is applied in a second pass, after the overwritten cart has actually
 * propagated through the store. Applying both in one pass would validate the
 * code against the *previous* cart and reject perfectly good codes.
 *
 * The query parameters are stripped from the URL as soon as the cart is
 * written. Without that, a refresh or a back-navigation would silently
 * overwrite the cart again and discard whatever the customer changed in the
 * meantime — the link is an entry point, not persistent state.
 */
export function useCheckoutPrefill({
  prefill,
  totalItems,
  clearCart,
  addItem,
  setPromoCodeValue,
  applyPromoCode,
}: UseCheckoutPrefillParams): { prefillApplied: boolean } {
  const cartWrittenRef = useRef(false);
  const codeAppliedRef = useRef(false);
  const [prefillApplied, setPrefillApplied] = useState(false);

  // Pass 1 — overwrite the cart and clean up the URL.
  useEffect(() => {
    if (!prefill || cartWrittenRef.current) return;
    cartWrittenRef.current = true;

    if (prefill.items.length > 0) {
      clearCart();
      for (const { product, quantity } of prefill.items) {
        addItem(product, quantity);
      }
    }

    if (prefill.discountCode) {
      setPromoCodeValue(prefill.discountCode);
    }

    setPrefillApplied(true);

    // replaceState rather than a router navigation: this must not add a
    // history entry, re-render the page or re-run the server component.
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("cart");
      url.searchParams.delete("code");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, [prefill, clearCart, addItem, setPromoCodeValue]);

  // Pass 2 — validate the code once the new cart is in place.
  useEffect(() => {
    if (!prefill?.discountCode) return;
    if (!cartWrittenRef.current || codeAppliedRef.current) return;

    // A code-only link applies against the existing cart; a link that also
    // sets products must wait for those products to land first.
    const cartIsReady = prefill.items.length === 0 || totalItems > 0;
    if (!cartIsReady) return;

    codeAppliedRef.current = true;
    // Failures surface through the promo code form's own error state, which
    // is what a customer following a link with an expired code should see.
    void applyPromoCode();
  }, [prefill, totalItems, applyPromoCode]);

  return { prefillApplied };
}
