"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/util/formatting";
import { Link } from "@/i18n/navigation";
import ActionButton from "@/app/_components/form/ActionButton";

const EMOJIS = ["🙏", "⭐️", "💙"];

function RotatingEmoji() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % EMOJIS.length);
        setIsVisible(true);
      }, 300);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="inline-block ml-2 transition-opacity duration-300"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {EMOJIS[currentIndex]}
    </span>
  );
}

interface CheckoutDonationProps {
  donationAmount: number;
  roundedTotal: number;
  onAddDonation: (e: React.MouseEvent) => void;
  onDismiss: () => void;
  disabled?: boolean;
}

export default function CheckoutDonation({
  donationAmount,
  roundedTotal,
  onAddDonation,
  onDismiss,
  disabled = false,
}: CheckoutDonationProps) {
  const t = useTranslations("checkout.donation");
  return (
    <div className="relative p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/40 rounded mb-4 space-y-2 text-center mt-6">
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 text-neutral-400 hover:text-white transition-colors"
        aria-label={t("dismiss")}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <h3 className={"text-xl text-neutral-200"}>
        {t("title")}
        <RotatingEmoji />
      </h3>
      <div className="text-sm text-neutral-300 pb-6">
        <p className=" mb-2">
          {t.rich("prompt", {
            amount: formatPrice(donationAmount),
            rounded: formatPrice(roundedTotal),
            strong: chunks => <strong>{chunks}</strong>,
            br: () => <br />,
          })}
        </p>
        <p>{t("description")}</p>
      </div>

      <ActionButton onClick={onAddDonation} size={"sm"} disabled={disabled}>
        {t("addButton", { amount: formatPrice(donationAmount) })}
      </ActionButton>
      <div>
        <Link href={"/about"} className={"link text-sm"} target={"_blank"}>
          {t("moreAbout")}
        </Link>
      </div>
    </div>
  );
}
