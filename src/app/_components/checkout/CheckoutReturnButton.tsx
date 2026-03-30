"use client";

import { useState, useEffect } from "react";
import ActionButton from "@/app/_components/form/ActionButton";

export default function CheckoutReturnButton() {
  const [returnUrl, setReturnUrl] = useState<string | null>(null);

  useEffect(() => {
    const storedUrl = localStorage.getItem("checkoutReturnUrl");
    if (storedUrl) {
      setReturnUrl(storedUrl);
      // Clear it after reading
      localStorage.removeItem("checkoutReturnUrl");
    }
  }, []);

  if (returnUrl === "/profile") {
    return (
      <div className="inline-block">
        <ActionButton href={returnUrl}>Return to Profile</ActionButton>
      </div>
    );
  }

  if (returnUrl) {
    return (
      <div className="inline-block">
        <ActionButton href={returnUrl}>Continue</ActionButton>
      </div>
    );
  }

  // Default: Continue Shopping
  return (
    <div className="inline-block">
      <ActionButton href="/store">Continue Shopping</ActionButton>
    </div>
  );
}
