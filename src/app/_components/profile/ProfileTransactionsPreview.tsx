"use client";

import { useState, useCallback } from "react";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";
import { formatTokensFromCents } from "@/lib/util/currency";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import WalletIcon from "@/app/_components/icon/WalletIcon";
import ProfileTable, { ProfileTableRow } from "./ProfileTable";
import clsx from "clsx";

interface ProfileTransactionsPreviewProps {
  userId: string;
  initialTransactions: SerializedWalletTransaction[];
  totalCount: number;
}

const typeLabels: Record<string, string> = {
  CREDIT: "Added",
  DEBIT: "Spent",
  PURCHASE: "Purchase",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

export default function ProfileTransactionsPreview({
  userId,
  initialTransactions,
  totalCount,
}: ProfileTransactionsPreviewProps) {
  const [transactions, setTransactions] =
    useState<SerializedWalletTransaction[]>(initialTransactions);
  const [count, setCount] = useState(totalCount);

  const handleWalletUpdate = useCallback(
    (payload: {
      transactionId: string;
      walletId: string;
      type: string;
      amount: number;
      balanceAfter: number;
      note: string | null;
      createdAt: string;
    }) => {
      setTransactions(prev => {
        if (prev.some(tx => tx.id === payload.transactionId)) {
          return prev;
        }

        const newTransaction: SerializedWalletTransaction = {
          id: payload.transactionId,
          walletId: payload.walletId,
          type: payload.type as SerializedWalletTransaction["type"],
          amount: payload.amount,
          balanceAfter: payload.balanceAfter,
          note: payload.note,
          createdById: null,
          createdAt: payload.createdAt,
          createdBy: null,
        };

        setCount(c => c + 1);
        return [newTransaction, ...prev].slice(0, 5);
      });
    },
    []
  );

  useRealtimeChannel({
    channelName: `user:${userId}`,
    event: "wallet_transaction_created",
    onMessage: handleWalletUpdate,
  });

  return (
    <ProfileTable
      title="Cashless Transactions"
      count={count}
      countLabel={count === 1 ? "transaction" : "transactions"}
      viewAllHref="/profile/transactions"
      isEmpty={transactions.length === 0}
      emptyIcon={<WalletIcon className="w-6 h-6 text-neutral-500" />}
      emptyMessage="No transactions yet"
    >
      {transactions.map((tx, index) => {
        const formattedDate = new Date(tx.createdAt).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        );

        return (
          <ProfileTableRow
            key={tx.id}
            href={`/profile/transactions/${tx.id}`}
            index={index}
          >
            <div className="flex items-center gap-3">
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  tx.amount > 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                )}
              >
                {tx.amount > 0 ? "+" : "-"}
              </div>
              <div>
                <div className="text-neutral-200 text-sm">
                  {typeLabels[tx.type] || tx.type}
                </div>
                <div className="text-xs text-neutral-500">{formattedDate}</div>
              </div>
            </div>
            <div
              className={clsx(
                "font-semibold",
                tx.amount > 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {tx.amount > 0 ? "+" : ""}
              {formatTokensFromCents(tx.amount)}
            </div>
          </ProfileTableRow>
        );
      })}
    </ProfileTable>
  );
}
