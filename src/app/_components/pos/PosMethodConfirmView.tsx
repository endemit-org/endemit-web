"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";
import { TipStepper } from "@/app/_components/payment/TipStepper";

interface OrderItem {
  name: string;
  quantity: number;
  total: number;
  direction?: "CREDIT" | "DEBIT";
}

interface Props {
  method: "CASH" | "CARD";
  items: OrderItem[];
  subtotal: number;
  /** Show the optional buyer-email input (ticket-linked orders). */
  showEmailField?: boolean;
  isProcessing: boolean;
  error: string | null;
  onConfirm: (tipAmount: number, buyerEmail?: string) => void;
  onBack: () => void;
}

/**
 * Seller-facing confirmation for physical tender. Cash: single "cash
 * received" confirm. Card: two steps — charge the external terminal (tip
 * still adjustable), then an explicit "charge approved" confirmation.
 */
export function PosMethodConfirmView({
  method,
  items,
  subtotal,
  showEmailField = false,
  isProcessing,
  error,
  onConfirm,
  onBack,
}: Props) {
  const t = useTranslations("pos.methodConfirm");
  const [tipAmount, setTipAmount] = useState(0);
  const [cardCharged, setCardCharged] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");

  const confirm = () =>
    onConfirm(tipAmount, buyerEmail.trim() || undefined);

  const hasTopUp = useMemo(
    () => items.some(item => item.direction === "CREDIT"),
    [items]
  );
  const total = subtotal + tipAmount;

  return (
    <div className="relative -mx-6 -my-6 px-6 py-6 bg-neutral-900 text-white rounded-b-2xl">
      <div className="bg-neutral-800/50 rounded-lg divide-y divide-neutral-700/50 mb-4">
        {items.map((item, i) => (
          <div key={i} className="px-4 py-3 flex justify-between text-sm">
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
          {method === "CASH" ? t("cashDue") : t("cardCharge")}
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-4xl font-bold text-white">
            {formatTokensFromCents(subtotal)}
          </span>
          {tipAmount > 0 && (
            <span className="text-2xl font-semibold text-amber-400">
              + {formatTokensFromCents(tipAmount)}
            </span>
          )}
        </div>
        {tipAmount > 0 && (
          <div className="text-neutral-500 text-xs mt-1">
            {t("totalWithTip", { amount: formatTokensFromCents(total) })}
          </div>
        )}
        {hasTopUp && (
          <div className="text-green-400 text-xs mt-1">{t("topUpNote")}</div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!hasTopUp && (
        <TipStepper
          tipAmount={tipAmount}
          onChange={setTipAmount}
          disabled={isProcessing || (method === "CARD" && cardCharged)}
        />
      )}

      {showEmailField && (
        <div className="mt-3">
          <label className="block text-xs text-neutral-400 mb-1">
            {t("buyerEmailLabel")}
          </label>
          <input
            type="email"
            value={buyerEmail}
            onChange={e => setBuyerEmail(e.target.value)}
            placeholder={t("buyerEmailPlaceholder")}
            disabled={isProcessing}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 pt-4">
        {method === "CASH" ? (
          <button
            onClick={confirm}
            disabled={isProcessing}
            className="w-full px-4 py-4 text-white text-lg font-semibold rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing
              ? t("processing")
              : t("cashReceived", { amount: formatTokensFromCents(total) })}
          </button>
        ) : !cardCharged ? (
          <>
            <p className="text-center text-sm text-neutral-400">
              {t("cardInstruction", { amount: formatTokensFromCents(total) })}
            </p>
            <button
              onClick={() => setCardCharged(true)}
              disabled={isProcessing}
              className="w-full px-4 py-4 text-white text-lg font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {t("chargedOnTerminal")}
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-neutral-400">
              {t("confirmApproved", { amount: formatTokensFromCents(total) })}
            </p>
            <button
              onClick={confirm}
              disabled={isProcessing}
              className="w-full px-4 py-4 text-white text-lg font-semibold rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? t("processing") : t("chargeApproved")}
            </button>
            <button
              onClick={() => setCardCharged(false)}
              disabled={isProcessing}
              className="text-neutral-500 hover:text-neutral-300 text-sm py-1 transition-colors"
            >
              {t("backToAmount")}
            </button>
          </>
        )}
        <button
          onClick={onBack}
          disabled={isProcessing}
          className="text-neutral-500 hover:text-neutral-300 text-sm py-1 transition-colors"
        >
          {t("back")}
        </button>
      </div>
    </div>
  );
}
