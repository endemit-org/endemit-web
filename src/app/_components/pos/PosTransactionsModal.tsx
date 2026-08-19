"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";

interface PosTransaction {
  id: string;
  shortCode: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  subtotal: number;
  tipAmount: number;
  total: number;
  createdAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  sellerName: string | null;
  customerName: string | null;
  items: Array<{ name: string; quantity: number; total: number }>;
}

interface Props {
  registerId: string;
  onClose: () => void;
}

const statusStyles: Record<PosTransaction["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function PosTransactionsModal({ registerId, onClose }: Props) {
  const t = useTranslations("pos.transactions");
  const [transactions, setTransactions] = useState<PosTransaction[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/pos/registers/${registerId}/transactions`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("loadFailed"));
      }
      setTransactions(data.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [registerId, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={load}
              disabled={isLoading}
              title={t("refresh")}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
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
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {error && (
            <div className="p-3 mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!transactions && !error && (
            <p className="text-center text-gray-500 py-8">{t("loading")}</p>
          )}

          {transactions && transactions.length === 0 && (
            <p className="text-center text-gray-500 py-8">{t("empty")}</p>
          )}

          {transactions && transactions.length > 0 && (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="border rounded-lg p-3 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-gray-900">
                        {tx.shortCode}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${statusStyles[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatTokensFromCents(tx.total)}
                      </span>
                      {tx.tipAmount > 0 && (
                        <span className="text-amber-600 ml-1 text-xs">
                          +{formatTokensFromCents(tx.tipAmount)}{" "}
                          {t("tipSuffix")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 flex justify-between gap-2">
                    <span>
                      <ClientDate date={tx.paidAt ?? tx.createdAt} />
                      {tx.customerName ? ` · ${tx.customerName}` : ""}
                    </span>
                    {tx.sellerName && <span>{tx.sellerName}</span>}
                  </div>

                  <div className="text-xs text-gray-600">
                    {tx.items
                      .map(item => `${item.quantity}x ${item.name}`)
                      .join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
