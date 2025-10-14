"use client";

import { useEffect } from "react";
import { useCart } from "@/stores/CartStore";
import { useLocalStorageForm } from "@/hooks/useLocalStorageForm";

export default function ClearCheckoutValues() {
  const { clearCart } = useCart();
  const { clearStorage } = useLocalStorageForm();

  useEffect(() => {
    clearCart();
    clearStorage();
  }, [clearCart, clearStorage]);

  return null;
}
