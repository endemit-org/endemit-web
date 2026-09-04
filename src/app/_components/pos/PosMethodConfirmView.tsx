"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";
import { TipStepper } from "@/app/_components/payment/TipStepper";
import UserAutocomplete from "@/app/_components/admin/UserAutocomplete";

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
  /** Rotate the content 180° toward the customer (tip entry). */
  isRotated?: boolean;
  onToggleRotation?: () => void;
  /**
   * Fires on mount and whenever the step changes, so the parent can turn
   * the screen toward the customer (tip) or back to the seller (tender).
   */
  onPhaseChange?: (phase: ConfirmPhase) => void;
  isProcessing: boolean;
  error: string | null;
  onConfirm: (tipAmount: number, buyerEmail?: string) => void;
  onBack: () => void;
  /** Live tip updates (e.g. the modal title mirrors the running total). */
  onTipChange?: (tipAmount: number) => void;
}

export type ConfirmPhase = "customer" | "cashier";

/**
 * Physical-tender confirmation in two steps. First the customer step (screen
 * turned toward them): the amount, an optional tip, and a confirm. Then the
 * cashier step (screen turned back): cash — "cash received"; card — charge
 * the external terminal, then an explicit "charge approved". Top-ups have
 * no tip, so they start at the cashier step.
 */
export function PosMethodConfirmView({
  method,
  items,
  subtotal,
  showEmailField = false,
  isRotated = false,
  onToggleRotation,
  onPhaseChange,
  isProcessing,
  error,
  onConfirm,
  onBack,
  onTipChange,
}: Props) {
  const t = useTranslations("pos.methodConfirm");
  const [tipAmount, setTipAmount] = useState(0);
  const [cardCharged, setCardCharged] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");

  const confirm = () => onConfirm(tipAmount, buyerEmail.trim() || undefined);

  const hasTopUp = useMemo(
    () => items.some(item => item.direction === "CREDIT"),
    [items]
  );
  const [phase, setPhase] = useState<ConfirmPhase>(
    hasTopUp ? "cashier" : "customer"
  );
  useEffect(() => {
    onPhaseChange?.(phase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const total = subtotal + tipAmount;

  const content = (
    <>
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
          {phase === "customer"
            ? t("amountDue")
            : method === "CASH"
              ? t("cashDue")
              : t("cardCharge")}
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

      {phase === "customer" && (
        <>
          <TipStepper
            tipAmount={tipAmount}
            onChange={value => {
              setTipAmount(value);
              onTipChange?.(value);
            }}
            disabled={isProcessing}
          />
          <p className="text-center text-sm text-neutral-400 pt-4">
            {t("customerHint")}
          </p>
          <div className="flex flex-col gap-3 pt-3">
            <button
              onClick={() => setPhase("cashier")}
              className="w-full px-4 py-4 text-white text-lg font-semibold rounded-xl bg-green-600 hover:bg-green-700 transition-colors"
            >
              {t("customerConfirm", { amount: formatTokensFromCents(total) })}
            </button>
            <button
              onClick={onBack}
              disabled={isProcessing}
              className="text-neutral-500 hover:text-neutral-300 text-sm py-1 transition-colors"
            >
              {t("back")}
            </button>
          </div>
        </>
      )}

      {phase === "cashier" && showEmailField && (
        <div className="mt-3">
          <label className="block text-xs text-neutral-400 mb-1">
            {t("buyerEmailLabel")}
          </label>
          {/* Same member autocomplete as the admin guest-ticket form; free
              text stays valid for non-member emails */}
          <UserAutocomplete
            value={buyerEmail}
            onChange={setBuyerEmail}
            onUserSelect={user => setBuyerEmail(user.email ?? "")}
            placeholder={t("buyerEmailPlaceholder")}
            disabled={isProcessing}
          />
        </div>
      )}

      {phase === "cashier" && (
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
          {!hasTopUp && (
            <button
              onClick={() => {
                setCardCharged(false);
                setPhase("customer");
              }}
              disabled={isProcessing}
              className="text-neutral-500 hover:text-neutral-300 text-sm py-1 transition-colors"
            >
              {t("changeTip")}
            </button>
          )}
          <button
            onClick={onBack}
            disabled={isProcessing}
            className="text-neutral-500 hover:text-neutral-300 text-sm py-1 transition-colors"
          >
            {t("back")}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="relative -mx-6 -my-6 px-6 py-6 bg-neutral-900 text-white rounded-b-2xl">
      {onToggleRotation && (
        <button
          onClick={onToggleRotation}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h5M20 20v-5h-5M4 20a9 9 0 0015-6.7M20 4a9 9 0 00-15 6.7"
            />
          </svg>
        </button>
      )}
      {isRotated ? (
        <div style={{ transform: "rotate(180deg)" }}>{content}</div>
      ) : (
        content
      )}
    </div>
  );
}
