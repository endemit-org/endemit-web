"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import AnimatedBalance from "@/app/_components/wallet/AnimatedBalance";
import WalletAnimationRenderer from "@/app/_components/wallet/WalletAnimationRenderer";
import { useWalletAnimation } from "@/app/_components/wallet/WalletCoinAnimation";

export const TIP_STEP = 10; // cents

interface Props {
  tipAmount: number;
  onChange: (tipAmount: number) => void;
  /** Whether another TIP_STEP can be added (e.g. wallet balance cap). */
  canAdd?: boolean;
  disabled?: boolean;
}

/** ±10-cent tip stepper with the coin fly-in/out animation. */
export function TipStepper({
  tipAmount,
  onChange,
  canAdd = true,
  disabled = false,
}: Props) {
  const t = useTranslations("profile.walletPay");
  const tipRef = useRef<HTMLSpanElement>(null);
  const tipAnim = useWalletAnimation();

  const handleStep = useCallback(
    (direction: 1 | -1) => {
      const next = Math.max(0, tipAmount + direction * TIP_STEP);
      if (next === tipAmount) return;
      onChange(next);
      tipAnim.triggerAnimation(direction === 1 ? "in" : "out", tipRef.current);
    },
    [tipAmount, onChange, tipAnim]
  );

  return (
    // Brief glow on appearance — a subtle nudge toward the tip option
    <motion.div
      initial={{
        backgroundColor: "rgba(245, 158, 11, 0.22)",
        borderColor: "rgba(251, 191, 36, 0.45)",
      }}
      animate={{
        backgroundColor: "rgba(245, 158, 11, 0.06)",
        borderColor: "rgba(251, 191, 36, 0.15)",
      }}
      transition={{ duration: 1.6, delay: 0.5, ease: "easeOut" }}
      className="border rounded-xl p-3 mt-2">
      <div className="text-sm text-amber-200/80 mb-2 text-center">
        {t("addTip")}
      </div>
      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => handleStep(-1)}
          disabled={tipAmount <= 0 || disabled}
          aria-label={t("tipMinus")}
          className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-2xl font-semibold leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </button>
        <WalletAnimationRenderer
          animations={tipAnim.animations}
          showGlow={tipAnim.showGlow}
          glowDirection={tipAnim.glowDirection}
          onAnimationComplete={tipAnim.removeAnimation}
        >
          <span
            ref={tipRef}
            className={`block min-w-[6rem] text-center text-2xl font-bold leading-none ${
              tipAmount > 0 ? "text-amber-300" : "text-neutral-500"
            }`}
          >
            <AnimatedBalance value={tipAmount} />
          </span>
        </WalletAnimationRenderer>
        <button
          onClick={() => handleStep(1)}
          disabled={!canAdd || disabled}
          aria-label={t("tipPlus")}
          className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-2xl font-semibold leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </motion.div>
  );
}
