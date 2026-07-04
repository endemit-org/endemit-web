"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  cutoffTimestamp: Date;
};

export default function ProductCountdown({ cutoffTimestamp }: Props) {
  const t = useTranslations("store");
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const cutoff = new Date(cutoffTimestamp).getTime();
      const difference = cutoff - now;

      if (difference <= 0) {
        setTimeRemaining(t("product.expired"));
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [cutoffTimestamp, t]);

  return (
    <div className={"py-2"}>{t("product.remaining", { time: timeRemaining })}</div>
  );
}
