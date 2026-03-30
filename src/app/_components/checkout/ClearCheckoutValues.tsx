"use client";

import { useEffect } from "react";
import { useCartStore } from "@/app/_stores/CartStore";
import { useSessionStorageForm } from "@/app/_hooks/useSessionStorageForm";

export default function ClearCheckoutValues() {
  const clearCart = useCartStore(state => state.clearCart);
  const hasHydrated = useCartStore(state => state._hasHydrated);
  const { clearStorage } = useSessionStorageForm();

  useEffect(() => {
    // Wait for hydration to complete before clearing
    if (hasHydrated) {
      clearCart();
      clearStorage();
    }
  }, [hasHydrated, clearCart, clearStorage]);

  return null;
}
