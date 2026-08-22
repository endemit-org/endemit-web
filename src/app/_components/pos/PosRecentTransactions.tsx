"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";
import ClientDate from "@/app/_components/ui/ClientDate";

interface PosTransaction {
  id: string;
  orderHash: string;
  shortCode: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: "WALLET" | "CASH" | "CARD" | null;
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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [registerId, t]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/v1/pos/registers/${registerId}/transactions?cursor=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("loadFailed"));
      }
      setTransactions(prev => {
        // A realtime refresh may have re-fetched page 1 meanwhile — dedupe.
        const seen = new Set((prev ?? []).map(tx => tx.id));
        const fresh = (data.transactions as PosTransaction[]).filter(
          tx => !seen.has(tx.id)
        );
        return [...(prev ?? []), ...fresh];
      });
      setNextCursor(data.nextCursor ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadFailed"));
    } finally {
      setIsLoadingMore(false);
    }
  }, [registerId, nextCursor, isLoadingMore, t]);

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
                onClick={() =>
                  setExpandedId(prev => (prev === tx.id ? null : tx.id))
                }
                className={`border rounded-lg px-3 py-2 text-xs space-y-1 cursor-pointer transition-colors ${
                  expandedId === tx.id ? "bg-gray-50" : "hover:bg-gray-50"
                }`}
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
                    {tx.paymentMethod && (
                      <span
                        className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                          tx.paymentMethod === "WALLET"
                            ? "bg-blue-100 text-blue-700"
                            : tx.paymentMethod === "CASH"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {tx.paymentMethod}
                      </span>
                    )}
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

                <div className="flex items-end justify-between gap-2">
                  <div className="text-gray-600">
                    {tx.items
                      .map(item => `${item.quantity}x ${item.name}`)
                      .join(", ")}
                  </div>
                  {tx.status === "PAID" && (
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          setQueuedIds(prev => new Set(prev).add(tx.id));
                          await fetch(
                            `/api/v1/pos/orders/${tx.orderHash}/print`,
                            { method: "POST" }
                          ).catch(() => {});
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {queuedIds.has(tx.id) ? t("printQueued") : t("print")}
                      </button>
                      <a
                        href={`/pos/receipt/${tx.orderHash}`}
                        target="_blank"
                        rel="noopener"
                        onClick={e => e.stopPropagation()}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {t("slip")}
                      </a>
                    </span>
                  )}
                </div>

                {expandedId === tx.id && (
                  <div className="border-t border-dashed pt-2 mt-1 space-y-1.5">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <span className="text-gray-500">{t("detail.paidBy")}</span>
                      <span className="text-gray-900 text-right">
                        {tx.customerName ?? t("detail.unknownCustomer")}
                      </span>
                      <span className="text-gray-500">{t("detail.method")}</span>
                      <span className="text-gray-900 text-right">
                        {tx.paymentMethod ?? "—"}
                      </span>
                      <span className="text-gray-500">{t("detail.seller")}</span>
                      <span className="text-gray-900 text-right">
                        {tx.sellerName ?? "—"}
                      </span>
                      <span className="text-gray-500">
                        {t("detail.created")}
                      </span>
                      <span className="text-gray-900 text-right">
                        <ClientDate date={tx.createdAt} />
                      </span>
                      {tx.paidAt && (
                        <>
                          <span className="text-gray-500">
                            {t("detail.paid")}
                          </span>
                          <span className="text-gray-900 text-right">
                            <ClientDate date={tx.paidAt} />
                          </span>
                        </>
                      )}
                      {tx.cancelledAt && (
                        <>
                          <span className="text-gray-500">
                            {t("detail.cancelled")}
                          </span>
                          <span className="text-red-600 text-right">
                            <ClientDate date={tx.cancelledAt} />
                          </span>
                        </>
                      )}
                    </div>

                    <div className="border-t pt-1.5 space-y-0.5">
                      {tx.items.map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-gray-600">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-900">
                            {formatTokensFromCents(item.total)}
                          </span>
                        </div>
                      ))}
                      {tx.tipAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            {t("detail.tip")}
                          </span>
                          <span className="text-amber-600">
                            {formatTokensFromCents(tx.tipAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span className="text-gray-700">
                          {t("detail.total")}
                        </span>
                        <span className="text-gray-900">
                          {formatTokensFromCents(tx.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {nextCursor && (
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full py-2 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-gray-50 border border-dashed rounded-lg disabled:opacity-50"
              >
                {isLoadingMore ? t("loading") : t("loadMore")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
