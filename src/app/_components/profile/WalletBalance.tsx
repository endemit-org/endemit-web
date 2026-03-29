"use client";

import { formatCurrency } from "@/lib/util/formatting";

interface WalletBalanceProps {
  balance: number;
}

export default function WalletBalance({ balance }: WalletBalanceProps) {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/50 rounded-xl p-8">
      <div className="text-center">
        <div className="text-sm text-purple-300 mb-2">Available Balance</div>
        <div
          className={`text-4xl font-bold ${
            balance > 0
              ? "text-green-400"
              : balance < 0
                ? "text-red-400"
                : "text-neutral-300"
          }`}
        >
          {formatCurrency(balance / 100)}
        </div>
        <div className="text-xs text-neutral-400 mt-3">
          Use your balance at checkout to pay for orders
        </div>
      </div>
    </div>
  );
}
