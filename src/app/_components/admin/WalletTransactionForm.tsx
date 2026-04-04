"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addWalletCreditAction } from "@/domain/wallet/actions/addWalletCreditAction";
import { debitWalletAction } from "@/domain/wallet/actions/debitWalletAction";
import { formatTokensFromCents, TOKEN_CONFIG } from "@/lib/util/currency";

interface WalletTransactionFormProps {
  walletId: string;
  currentBalance: number;
}

export default function WalletTransactionForm({
  walletId,
  currentBalance,
}: WalletTransactionFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (type: "credit" | "debit") => {
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Please enter a valid positive amount");
      return;
    }

    if (type === "debit" && amountCents > currentBalance) {
      setError(
        `Cannot debit more than current balance (${formatTokensFromCents(currentBalance)})`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (type === "credit") {
        await addWalletCreditAction({
          walletId,
          amount: amountCents,
          note: note || undefined,
        });
        setSuccess(`Added ${formatTokensFromCents(amountCents)} to wallet`);
      } else {
        await debitWalletAction({
          walletId,
          amount: amountCents,
          note: note || undefined,
        });
        setSuccess(`Removed ${formatTokensFromCents(amountCents)} from wallet`);
      }

      setAmount("");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount ({TOKEN_CONFIG.symbol})
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Note (optional)
          </label>
          <input
            type="text"
            id="note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Reason for transaction"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleSubmit("credit")}
          disabled={isSubmitting || !amount}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing..." : "+ Add Credit"}
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("debit")}
          disabled={isSubmitting || !amount || currentBalance === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Processing..." : "- Remove Funds"}
        </button>
      </div>
    </div>
  );
}
