"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { SerializedWallet, SerializedWalletTransaction } from "@/domain/wallet/types";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import { formatDateTime, formatCurrency } from "@/lib/util/formatting";
import WalletTransactionForm from "./WalletTransactionForm";
import WalletTransactionsTable from "./WalletTransactionsTable";

interface AdminWalletDetailProps {
  wallet: SerializedWallet & { transactions: SerializedWalletTransaction[] };
  canManageBalance: boolean;
}

export default function AdminWalletDetail({
  wallet: initialWallet,
  canManageBalance,
}: AdminWalletDetailProps) {
  const [balance, setBalance] = useState(initialWallet.balance);
  const [transactions, setTransactions] = useState(initialWallet.transactions);

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
      // Only update if this is for our wallet
      if (payload.walletId !== initialWallet.id) return;

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
    [initialWallet.id]
  );

  // Subscribe to wallet updates for the wallet owner
  useRealtimeChannel({
    channelName: `user:${initialWallet.userId}`,
    event: "wallet_transaction_created",
    onMessage: handleWalletUpdate,
  });

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {initialWallet.user?.name ||
                initialWallet.user?.username ||
                "Unknown User"}
            </h1>
            {initialWallet.user?.email && (
              <p className="text-sm text-gray-500 mt-1">
                {initialWallet.user.email}
              </p>
            )}
            <Link
              href={`/admin/users/${initialWallet.userId}`}
              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              View User Profile
            </Link>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Current Balance</div>
            <div
              className={`text-3xl font-bold transition-colors ${
                balance > 0
                  ? "text-green-600"
                  : balance < 0
                    ? "text-red-600"
                    : "text-gray-500"
              }`}
            >
              {formatCurrency(balance / 100)}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Wallet Info */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Wallet Information
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Wallet ID:</span>
              <span className="font-mono text-sm">{initialWallet.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span>{formatDateTime(new Date(initialWallet.createdAt))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span>{formatDateTime(new Date(initialWallet.updatedAt))}</span>
            </div>
          </div>
        </section>

        {/* Add/Remove Balance */}
        {canManageBalance && (
          <section>
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
              Manage Balance
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <WalletTransactionForm
                walletId={initialWallet.id}
                currentBalance={balance}
              />
            </div>
          </section>
        )}

        {/* Transaction History */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Transaction History ({transactions.length})
          </h2>
          <WalletTransactionsTable transactions={transactions} />
        </section>
      </div>
    </div>
  );
}
