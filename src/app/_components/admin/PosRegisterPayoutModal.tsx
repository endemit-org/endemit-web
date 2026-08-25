"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { PosPayoutType } from "@prisma/client";
import { fetchPosRegisterPayoutsAction } from "@/domain/pos/actions/fetchPosRegisterPayoutsAction";
import { createPosPayoutAction } from "@/domain/pos/actions/createPosPayoutAction";
import type { PosRegisterPayoutsResult } from "@/domain/pos/operations/getPosRegisterPayouts";
import { formatTokensFromCents, TOKEN_CONFIG } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";

interface Props {
  registerId: string;
  registerName: string;
  onClose: () => void;
  onRecorded: (totals: {
    outstandingTips: number;
    outstandingCash: number;
  }) => void;
}

export default function PosRegisterPayoutModal({
  registerId,
  registerName,
  onClose,
  onRecorded,
}: Props) {
  const t = useTranslations("admin.pos.registers.payout");
  const terr = useTranslations("admin.common.errors");
  const [data, setData] = useState<PosRegisterPayoutsResult | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [type, setType] = useState<PosPayoutType>("TIPS");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchPosRegisterPayoutsAction(registerId);
      setData(result);
      setLoadError(null);
      return result;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : terr("loadFailed"));
      return null;
    }
  }, [registerId, terr]);

  useEffect(() => {
    load();
  }, [load]);

  const outstanding =
    data === null
      ? 0
      : type === "TIPS"
        ? data.outstandingTips
        : data.outstandingCash;

  const amountCents = Math.round(parseFloat(amount || "0") * 100);

  const selectType = (newType: PosPayoutType) => {
    setType(newType);
    setAmount("");
    setError(null);
    setConfirming(false);
  };

  const handleSubmit = async () => {
    if (isNaN(amountCents) || amountCents <= 0) {
      setError(t("errorInvalidAmount"));
      setConfirming(false);
      return;
    }
    if (amountCents > outstanding) {
      setError(
        t("errorExceedsOutstanding", {
          outstanding: formatTokensFromCents(outstanding),
        })
      );
      setConfirming(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createPosPayoutAction({
        registerId,
        type,
        amount: amountCents,
        note: note || undefined,
      });
      setSuccess(
        t("recorded", { amount: formatTokensFromCents(amountCents) })
      );
      setAmount("");
      setNote("");
      const fresh = await load();
      if (fresh) {
        onRecorded({
          outstandingTips: fresh.outstandingTips,
          outstandingCash: fresh.outstandingCash,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {t("title", { name: registerName })}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loadError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {loadError}
            </div>
          )}

          {!data && !loadError && (
            <p className="text-center text-gray-500 py-6">{t("loading")}</p>
          )}

          {data && (
            <>
              {/* Type selector with outstanding amounts */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => selectType("TIPS")}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    type === "TIPS"
                      ? "border-amber-400 bg-amber-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-xs text-gray-500">
                    {t("outstandingTips")}
                  </div>
                  <div className="text-xl font-semibold text-amber-600">
                    {formatTokensFromCents(data.outstandingTips)}
                  </div>
                </button>
                <button
                  onClick={() => selectType("CASH")}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    type === "CASH"
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-xs text-gray-500">
                    {t("outstandingCash")}
                  </div>
                  <div className="text-xl font-semibold text-red-600">
                    {formatTokensFromCents(data.outstandingCash)}
                  </div>
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              {/* Payout form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("amountLabel", { symbol: TOKEN_CONFIG.symbol })}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={amount}
                      onChange={e => {
                        setAmount(e.target.value);
                        setConfirming(false);
                      }}
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                    <button
                      onClick={() => {
                        setAmount((outstanding / 100).toFixed(2));
                        setConfirming(false);
                      }}
                      disabled={isSubmitting || outstanding <= 0}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md whitespace-nowrap disabled:opacity-50"
                    >
                      {t("allButton")}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("noteLabel")}
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={t("notePlaceholder")}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {confirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    {t("confirmText", {
                      amount: formatTokensFromCents(amountCents || 0),
                    })}
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
                  >
                    {isSubmitting ? t("recording") : t("confirmButton")}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    {t("cancelButton")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setConfirming(true);
                  }}
                  disabled={!amount || outstanding <= 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {type === "TIPS"
                    ? t("recordTipsButton")
                    : t("recordCashButton")}
                </button>
              )}

              {/* History */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  {t("historyHeading")}
                </h3>
                {data.payouts.length === 0 ? (
                  <p className="text-sm text-gray-500">{t("noHistory")}</p>
                ) : (
                  <div className="border rounded-lg divide-y text-sm">
                    {data.payouts.map(p => (
                      <div key={p.id} className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                              p.type === "TIPS"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {p.type === "TIPS"
                              ? t("typeTips")
                              : t("typeCash")}
                          </span>
                          <span className="font-medium">
                            {formatTokensFromCents(p.amount)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex justify-between gap-2">
                          <span>
                            <ClientDate date={p.createdAt} />
                            {p.note ? ` · ${p.note}` : ""}
                          </span>
                          <span>
                            {p.createdBy.name || p.createdBy.email || ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
