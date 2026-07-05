"use client";

import { useState, useEffect } from "react";
import ActionButton from "@/app/_components/form/ActionButton";
import { useTranslations } from "next-intl";

export default function CheckoutReturnButton({ orderId }: { orderId: string }) {
  const t = useTranslations("checkout.return");
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
        <ActionButton href={returnUrl}>{t("toProfile")}</ActionButton>
      </div>
    );
  }

  if (returnUrl) {
    return (
      <div className="inline-block">
        <ActionButton href={returnUrl}>{t("continue")}</ActionButton>
      </div>
    );
  }

  // Default: Continue Shopping
  return (
    <div className="inline-block">
      <ActionButton href={`/profile/orders/${orderId}`}>
        {t("viewOrder")}
      </ActionButton>
    </div>
  );
}
