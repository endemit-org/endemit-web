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
  /**
   * The promo code currently in the form. Needed because `applyPromoCode`
   * validates the code held in checkout state, not one passed as an argument.
   */
  promoCodeValue: string;
  /**
   * Cart value the discount will be validated against (subtotal + shipping).
   * `applyPromoCode` refuses to run while this is 0.
   */
  cartValue: number;
  clearCart: () => void;
  addItem: (product: Product, quantity?: number) => void;
  setPromoCodeValue: (value: string) => void;
  applyPromoCode: () => Promise<void>;
}

/**
 * Applies a shareable pre-filled checkout link to the cart, once.
 *
 * Sequencing matters here, and getting it wrong is not silent. The promo code
 * can only be validated against a cart, since qualification depends on the
 * items and the order total — so the code is applied in a second pass, after
 * the overwritten cart has propagated through the store *and* the code has
 * landed in checkout state.
 *
 * Both conditions have to be waited for explicitly: `applyPromoCode` reads
 * the code and totals out of checkout state rather than taking arguments, and
 * rejects with "Invalid promo code or cart amount" if either is still empty.
 * Firing on the cart alone meant running against a state snapshot where the
 * code was still "" and the subtotal still 0, which failed every time while a
 * manual retry succeeded.
 *
 * The query parameters are stripped from the URL as soon as the cart is
 * written. Without that, a refresh or a back-navigation would silently
 * overwrite the cart again and discard whatever the customer changed in the
 * meantime — the link is an entry point, not persistent state.
 */
export function useCheckoutPrefill({
  prefill,
  totalItems,
  promoCodeValue,
  cartValue,
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

  // Pass 2 — validate the code once the cart and the code are both in state.
  useEffect(() => {
    const code = prefill?.discountCode;
    if (!code) return;
    if (!cartWrittenRef.current || codeAppliedRef.current) return;

    // The code must have reached checkout state, or validation runs against
    // an empty code. Compared case-insensitively because the form may
    // normalize what was written into it.
    if (promoCodeValue.trim().toUpperCase() !== code.toUpperCase()) return;

    // A code-only link applies against the existing cart; a link that also
    // sets products must wait for those products to land.
    if (prefill.items.length > 0 && totalItems === 0) return;

    // Shipping resolves asynchronously, so a zero here can simply mean "not
    // costed yet" rather than "empty cart".
    if (cartValue <= 0) return;

    codeAppliedRef.current = true;
    // Failures surface through the promo code form's own error state, which
    // is what a customer following a link with a spent code should see.
    void applyPromoCode();
  }, [prefill, totalItems, promoCodeValue, cartValue, applyPromoCode]);

  return { prefillApplied };
}
