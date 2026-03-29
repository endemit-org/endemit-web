"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/util/formatting";
import Link from "next/link";
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
}

export default function CheckoutDonation({
  donationAmount,
  roundedTotal,
  onAddDonation,
}: CheckoutDonationProps) {
  return (
    <div className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/40 rounded mb-4 space-y-2 text-center">
      <h3 className={"text-xl text-neutral-200"}>
        Donations keep us running
        <RotatingEmoji />
      </h3>
      <div className="text-sm text-neutral-300 pb-6">
        <p className=" mb-2">
          Add <strong>{formatPrice(donationAmount)} donation</strong> to your
          total
          <br />
          and <strong>round up to {formatPrice(roundedTotal)}</strong>?
        </p>
        <p>
          We are volunteers dedicated to a non-profit. Donations support our
          work and help us keep ticket prices low.
        </p>
      </div>

      <ActionButton onClick={onAddDonation} size={"sm"}>
        Add {formatPrice(donationAmount)} donation
      </ActionButton>
      <div>
        <Link href={"/about"} className={"link text-sm"} target={"_blank"}>
          More about our non-profit
        </Link>
      </div>
    </div>
  );
}
