"use client";

import { useState, useCallback } from "react";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import WalletBalance from "./WalletBalance";
import WalletTransactionList from "./WalletTransactionList";

interface WalletDisplayProps {
  userId: string;
  initialBalance: number;
  initialTransactions: SerializedWalletTransaction[];
}

export default function WalletDisplay({
  userId,
  initialBalance,
  initialTransactions,
}: WalletDisplayProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [transactions, setTransactions] =
    useState<SerializedWalletTransaction[]>(initialTransactions);

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
      // Update balance
      setBalance(payload.balanceAfter);

      // Add new transaction to the top of the list
      setTransactions(prev => {
        // Avoid duplicates
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

        return [newTransaction, ...prev];
      });
    },
    []
  );

  // Subscribe to wallet updates for this user
  useRealtimeChannel({
    channelName: `user:${userId}`,
    event: "wallet_transaction_created",
    onMessage: handleWalletUpdate,
  });

  return (
    <>
      {/* Balance Card */}
      <WalletBalance balance={balance} />

      {/* Transaction History */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-200 mb-4">
          Transaction History
        </h2>
        <WalletTransactionList transactions={transactions} />
      </section>
    </>
  );
}
