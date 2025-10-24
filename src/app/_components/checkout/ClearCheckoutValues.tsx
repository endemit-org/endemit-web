"use client";

import { useEffect } from "react";
import { useCart } from "@/app/_stores/CartStore";
import { useSessionStorageForm } from "@/app/_hooks/useSessionStorageForm";

export default function ClearCheckoutValues() {
  const { clearCart } = useCart();
  const { clearStorage } = useSessionStorageForm();

  useEffect(() => {
    clearCart();
    clearStorage();
  }, [clearCart, clearStorage]);

  return null;
}
