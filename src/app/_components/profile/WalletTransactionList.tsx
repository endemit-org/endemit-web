"use client";

import type { SerializedWalletTransaction } from "@/domain/wallet/types";
import { formatDateTime, formatCurrency } from "@/lib/util/formatting";
import clsx from "clsx";

interface WalletTransactionListProps {
  transactions: SerializedWalletTransaction[];
}

const typeLabels: Record<string, string> = {
  CREDIT: "Credit Added",
  DEBIT: "Funds Removed",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

const typeIcons: Record<string, string> = {
  CREDIT: "+",
  DEBIT: "-",
  PURCHASE: "-",
  REFUND: "+",
  ADJUSTMENT: "~",
};

export default function WalletTransactionList({
  transactions,
}: WalletTransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-neutral-800 rounded-lg p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-neutral-700 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-300 mb-2">
          No transactions yet
        </h3>
        <p className="text-neutral-500 text-sm">
          Your wallet transaction history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg overflow-hidden">
      <div className="divide-y divide-neutral-700">
        {transactions.map(tx => (
          <div
            key={tx.id}
            className="p-4 flex items-center justify-between hover:bg-neutral-700/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div
                className={clsx(
                  "w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold",
                  tx.amount > 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                )}
              >
                {typeIcons[tx.type] || "?"}
              </div>
              <div>
                <div className="text-neutral-200 font-medium">
                  {typeLabels[tx.type] || tx.type}
                </div>
                <div className="text-sm text-neutral-400">
                  {formatDateTime(new Date(tx.createdAt))}
                </div>
                {tx.note && (
                  <div className="text-xs text-neutral-500 mt-1">{tx.note}</div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div
                className={clsx(
                  "text-lg font-semibold",
                  tx.amount > 0 ? "text-green-400" : "text-red-400"
                )}
              >
                {tx.amount > 0 ? "+" : ""}
                {formatCurrency(tx.amount / 100)}
              </div>
              <div className="text-xs text-neutral-500">
                Balance: {formatCurrency(tx.balanceAfter / 100)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
