"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { formatTokensFromCents } from "@/lib/util/currency";
import AnimatedBalance from "@/app/_components/wallet/AnimatedBalance";
import WalletAnimationRenderer from "@/app/_components/wallet/WalletAnimationRenderer";
import { useWalletAnimation } from "@/app/_components/wallet/WalletCoinAnimation";

export interface PaymentConfirmOrder {
  id: string;
  shortCode: string;
  orderHash: string;
  subtotal: number;
  total: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    total: number;
    direction: "CREDIT" | "DEBIT";
  }>;
  register: { id: string; name: string };
}

export interface PaymentConfirmCustomer {
  id: string;
  name: string | null;
  balance: number;
}

interface Props {
  order: PaymentConfirmOrder;
  customer: PaymentConfirmCustomer;
  isRotated?: boolean;
  isProcessing: boolean;
  error: string | null;
  onPay: (tipAmount: number) => void;
}

const TIP_STEP = 10; // cents

export function PaymentConfirmView({
  order,
  customer,
  isRotated = false,
  isProcessing,
  error,
  onPay,
}: Props) {
  const t = useTranslations("profile.walletPay");
  const [tipAmount, setTipAmount] = useState(0);
  const tipRef = useRef<HTMLSpanElement>(null);
  const tipAnim = useWalletAnimation();

  const { creditTotal, debitTotal } = useMemo(() => {
    let credit = 0;
    let debit = 0;
    for (const item of order.items) {
      if (item.direction === "CREDIT") credit += item.total;
      else debit += item.total;
    }
    return { creditTotal: credit, debitTotal: debit };
  }, [order.items]);

  const hasTopUp = creditTotal > 0;

  const totalToPay = debitTotal + tipAmount;
  const balanceAfter = customer.balance + creditTotal - totalToPay;
  const canPay = balanceAfter >= 0;
  const canAddTip = balanceAfter >= TIP_STEP;

  const handlePay = useCallback(() => {
    if (!canPay || isProcessing) return;
    onPay(tipAmount);
  }, [canPay, isProcessing, onPay, tipAmount]);

  const handleTipStep = useCallback(
    (direction: 1 | -1) => {
      const next = Math.max(0, tipAmount + direction * TIP_STEP);
      if (next === tipAmount) return;
      setTipAmount(next);
      tipAnim.triggerAnimation(direction === 1 ? "in" : "out", tipRef.current);
    },
    [tipAmount, tipAnim]
  );

  const content = (
    <>
      <div className="bg-neutral-800/50 rounded-lg divide-y divide-neutral-700/50 mb-4">
        {order.items.map((item, i) => (
          <div
            key={i}
            className="px-4 py-3 flex justify-between text-sm"
          >
            <span className="text-neutral-400">
              {item.quantity}x {item.name}
            </span>
            <span className="text-neutral-300">
              {formatTokensFromCents(item.total)}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-neutral-800 rounded-xl p-3 mb-4 text-center">
        <div className="text-neutral-500 text-sm mb-1">
          {hasTopUp ? t("topUpAmount") : t("totalToPay")}
        </div>
        {hasTopUp ? (
          <div className="text-4xl font-bold text-green-400">
            +{formatTokensFromCents(creditTotal)}
          </div>
        ) : tipAmount > 0 ? (
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-white">
              {formatTokensFromCents(debitTotal)}
            </span>
            <span className="text-2xl font-semibold text-amber-400">
              + {formatTokensFromCents(tipAmount)}
            </span>
          </div>
        ) : (
          <div className="text-4xl font-bold text-white">
            {formatTokensFromCents(totalToPay)}
          </div>
        )}
        {tipAmount > 0 && !hasTopUp && (
          <div className="text-neutral-500 text-xs mt-1">
            {t("totalWithTip", { amount: formatTokensFromCents(totalToPay) })}
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-neutral-500 mb-1 px-1">
        <span>
          {t("balance")}: {formatTokensFromCents(customer.balance)}
        </span>
        <span>
          {t("balanceAfter")}: {formatTokensFromCents(balanceAfter)}
        </span>
      </div>

      {!canPay && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm text-center">
          {t("errors.insufficientBalance")}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!hasTopUp && (
        <div className="bg-amber-500/[0.06] border border-amber-400/15 rounded-xl p-3 mt-2">
          <div className="text-sm text-amber-200/80 mb-2 text-center">
            {t("addTip")}
          </div>
          <div className="flex items-center justify-center gap-5">
            <button
              onClick={() => handleTipStep(-1)}
              disabled={tipAmount <= 0 || isProcessing}
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
              onClick={() => handleTipStep(1)}
              disabled={!canAddTip || isProcessing}
              aria-label={t("tipPlus")}
              className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-2xl font-semibold leading-none transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={handlePay}
          disabled={!canPay || isProcessing}
          className={`w-full px-4 py-4 text-white text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            hasTopUp
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isProcessing
            ? t("processing")
            : hasTopUp
              ? t("topUpButton", { amount: formatTokensFromCents(creditTotal) })
              : t("payButton", { amount: formatTokensFromCents(totalToPay) })}
        </button>
      </div>
    </>
  );

  if (isRotated) {
    return (
      <div style={{ transform: "rotate(180deg)" }}>
        {content}
      </div>
    );
  }

  return <>{content}</>;
}
