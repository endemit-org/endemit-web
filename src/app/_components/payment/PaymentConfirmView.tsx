"use client";

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
  { label: "No tip", value: 0 },
  { label: "12%", percent: 12 },
  { label: "25%", percent: 25 },
];

const CUSTOM_TIP_PRESET: TipPreset = { label: "Custom", value: -1 };

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

  const tipPresets = allowCustomTip
    ? [...BASE_TIP_PRESETS, CUSTOM_TIP_PRESET]
    : BASE_TIP_PRESETS;

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

      {!hasTopUp && (
        <div className="mb-4">
          <div className="text-sm text-neutral-500 mb-2">Add a tip?</div>
          <div
            className={`grid gap-2 ${
              tipPresets.length === 4 ? "grid-cols-4" : "grid-cols-3"
            }`}
          >
            {tipPresets.map(preset => {
              const isCustom = preset.value === -1;
              const presetValue =
                "percent" in preset && preset.percent !== undefined
                  ? preset.percent
                  : (preset.value ?? 0);
              const isSelected = isCustom
                ? showCustomTip
                : !showCustomTip && selectedTip === presetValue;

              return (
                <button
                  key={preset.label}
                  onClick={() => {
                    if (isCustom) {
                      setShowCustomTip(true);
                      setSelectedTip(0);
                    } else {
                      setShowCustomTip(false);
                      setCustomTip("");
                      setSelectedTip(presetValue);
                    }
                  }}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          {showCustomTip && allowCustomTip && (
            <div className="mt-3">
              <input
                type="number"
                placeholder={`Enter amount in ${TOKEN_CONFIG.symbol}`}
                value={customTip}
                onChange={e => setCustomTip(e.target.value)}
                autoFocus
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-center text-lg"
              />
            </div>
          )}
        </div>
      )}

      <div className="bg-neutral-800 rounded-xl p-3 mb-4 text-center">
        <div className="text-neutral-500 text-sm mb-1">
          {hasTopUp ? "Top-up Amount" : "Total to Pay"}
        </div>
        <div
          className={`text-4xl font-bold ${hasTopUp ? "text-green-400" : "text-white"}`}
        >
          {hasTopUp
            ? `+${formatTokensFromCents(creditTotal)}`
            : formatTokensFromCents(totalToPay)}
        </div>
        {tipAmount > 0 && (
          <div className="text-neutral-500 text-sm mt-1">
            includes {formatTokensFromCents(tipAmount)} tip
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-neutral-500 mb-1 px-1">
        <span>Balance: {formatTokensFromCents(customer.balance)}</span>
        <span>After: {formatTokensFromCents(balanceAfter)}</span>
      </div>

      {!canPay && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm text-center">
          Insufficient balance. Please top up your wallet.
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
          {error}
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
            ? "Processing..."
            : hasTopUp
              ? `Top-up ${formatTokensFromCents(creditTotal)}`
              : `Pay ${formatTokensFromCents(totalToPay)}`}
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
