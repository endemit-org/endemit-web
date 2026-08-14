"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { formatTokensFromCents, TOKEN_CONFIG } from "@/lib/util/currency";

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
  allowCustomTip?: boolean;
  isProcessing: boolean;
  error: string | null;
  onPay: (tipAmount: number) => void;
  onCancel: () => void;
}

interface TipPreset {
  label: string;
  value?: number;
  percent?: number;
}

const BASE_TIP_PRESETS: TipPreset[] = [
  { label: "noTip", value: 0 },
  { label: "5%", percent: 5 },
  { label: "10%", percent: 10 },
  { label: "15%", percent: 15 },
];

export function PaymentConfirmView({
  order,
  customer,
  isRotated = false,
  allowCustomTip = true,
  isProcessing,
  error,
  onPay,
  onCancel,
}: Props) {
  const t = useTranslations("profile.walletPay");
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [showCustomTip, setShowCustomTip] = useState(false);

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

  const tipAmount = useMemo(() => {
    if (hasTopUp) return 0;
    if (showCustomTip && customTip) {
      return Math.round(parseFloat(customTip) * 100) || 0;
    }
    if (selectedTip <= 0) return 0;
    return Math.round((debitTotal * selectedTip) / 100);
  }, [hasTopUp, showCustomTip, customTip, selectedTip, debitTotal]);

  const totalToPay = debitTotal + tipAmount;
  const balanceAfter = customer.balance + creditTotal - totalToPay;
  const canPay = balanceAfter >= 0;

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
        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-3 mt-2">
          <div className="text-sm text-neutral-300 mb-2">{t("addTip")}</div>
          <div className="grid gap-2 grid-cols-4">
            {BASE_TIP_PRESETS.map(preset => {
              const presetValue =
                "percent" in preset && preset.percent !== undefined
                  ? preset.percent
                  : (preset.value ?? 0);
              const isSelected = !showCustomTip && selectedTip === presetValue;

              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    setShowCustomTip(false);
                    setCustomTip("");
                    setSelectedTip(presetValue);
                  }}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {preset.label === "noTip" ? t(preset.label) : preset.label}
                </button>
              );
            })}
          </div>
          {allowCustomTip && !showCustomTip && (
            <button
              onClick={() => {
                setShowCustomTip(true);
                setSelectedTip(0);
              }}
              className="w-full mt-2 py-2 rounded-lg text-sm font-medium bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
            >
              {t("customTip")}
            </button>
          )}
          {showCustomTip && allowCustomTip && (
            <div className="mt-2">
              <input
                type="number"
                placeholder={`Enter amount in ${TOKEN_CONFIG.symbol}`}
                value={customTip}
                onChange={e => setCustomTip(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-neutral-800 border border-blue-500 rounded-lg text-white text-center text-lg"
              />
            </div>
          )}
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
        <button
          onClick={onCancel}
          className="text-neutral-500 hover:text-neutral-300 text-sm py-2 transition-colors"
        >
          Cancel
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
