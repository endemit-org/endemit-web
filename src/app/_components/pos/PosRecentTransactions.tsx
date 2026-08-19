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
  /** Bump to refetch (e.g. when a realtime order event arrives). */
  refreshKey?: number;
}

const statusStyles: Record<PosTransaction["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function PosRecentTransactions({ registerId, refreshKey = 0 }: Props) {
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
  }, [load, refreshKey]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <span className="font-medium text-sm">{t("title")}</span>
        <button
          onClick={load}
          disabled={isLoading}
          title={t("refresh")}
          className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
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
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {error && (
          <div className="p-2 mb-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
            {error}
          </div>
        )}

        {!transactions && !error && (
          <p className="text-center text-gray-500 text-sm py-4">
            {t("loading")}
          </p>
        )}

        {transactions && transactions.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">{t("empty")}</p>
        )}

        {transactions && transactions.length > 0 && (
          <div className="space-y-2">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="border rounded-lg px-3 py-2 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-gray-900">
                      {tx.shortCode}
                    </span>
                    <span
                      className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${statusStyles[tx.status]}`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-semibold text-gray-900">
                      {formatTokensFromCents(tx.total)}
                    </span>
                    {tx.tipAmount > 0 && (
                      <span className="text-amber-600 ml-1">
                        +{formatTokensFromCents(tx.tipAmount)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-gray-500 flex justify-between gap-2">
                  <span>
                    <ClientDate date={tx.paidAt ?? tx.createdAt} />
                    {tx.customerName ? ` · ${tx.customerName}` : ""}
                  </span>
                  {tx.sellerName && <span>{tx.sellerName}</span>}
                </div>

                <div className="text-gray-600">
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
  );
}
