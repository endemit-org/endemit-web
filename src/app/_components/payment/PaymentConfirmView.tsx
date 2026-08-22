"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { formatTokensFromCents } from "@/lib/util/currency";
import { TipStepper, TIP_STEP } from "@/app/_components/payment/TipStepper";

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
        <TipStepper
          tipAmount={tipAmount}
          onChange={setTipAmount}
          canAdd={canAddTip}
          disabled={isProcessing}
        />
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
