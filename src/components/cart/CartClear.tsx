"use client";

import { useEffect } from "react";
import { useCart } from "@/stores/CartStore";

export default function CartClear() {
  const { clearCart } = useCart();

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return null;
}
