"use client";

import { useState, useCallback } from "react";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import WalletBalance from "./WalletBalance";
import WalletTransactionList from "./WalletTransactionList";
import { WalletPayScanner } from "@/app/_components/wallet/WalletPayScanner";

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
  const [isPayScannerOpen, setIsPayScannerOpen] = useState(false);

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

  const refreshTransactions = useCallback(async () => {
    // Simple page refresh for now - could be optimized with API call
    window.location.reload();
  }, []);

  return (
    <>
      {/* Balance Card */}
      <WalletBalance balance={balance} />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsPayScannerOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
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
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            />
          </svg>
          Scan to Pay
        </button>
        <button
          onClick={() => {
            // TODO: Implement Stripe top-up checkout
            alert("Top-up via card coming soon!");
          }}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-xl border border-neutral-700 transition-colors"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Top Up
        </button>
      </div>

      <div className={"text-sm italic text-neutral-400"}>
        Top up cashless by clicking the button above. You can top-up with cash
        at the MERCH stand.
      </div>

      {/* Transaction History */}
      <section>
        <h2 className="text-xl font-semibold text-neutral-200 mb-4">
          Transaction History
        </h2>
        <WalletTransactionList transactions={transactions} />
      </section>

      {/* Pay Scanner Modal */}
      <WalletPayScanner
        isOpen={isPayScannerOpen}
        onClose={() => setIsPayScannerOpen(false)}
        onPaymentComplete={refreshTransactions}
      />
    </>
  );
}
