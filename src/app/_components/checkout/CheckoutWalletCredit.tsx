"use client";

import { formatCurrency } from "@/lib/util/formatting";
import Spinner from "@/app/_components/ui/Spinner";
import WalletIcon from "@/app/_components/icon/WalletIcon";

interface CheckoutWalletCreditProps {
  walletBalance: number; // in cents
  walletCreditAmount: number; // in cents
  maxWalletCredit: number; // in cents
  remainingToPay: number; // in EUR
  isLoading: boolean;
  canUseWallet: boolean;
  isUsingWallet: boolean;
  onToggle: () => void;
  onAmountChange: (amount: number) => void;
}

export default function CheckoutWalletCredit({
  walletBalance,
  walletCreditAmount,
  maxWalletCredit,
  remainingToPay,
  isLoading,
  canUseWallet,
  isUsingWallet,
  onToggle,
  onAmountChange,
}: CheckoutWalletCreditProps) {
  if (isLoading) {
    return (
      <div className="bg-neutral-800 rounded-lg p-4">
        <Spinner text="Checking wallet balance..." />
      </div>
    );
  }

  if (!canUseWallet) {
    return null;
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAmountChange(parseInt(e.target.value, 10));
  };

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/40 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <WalletIcon className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-200">Use Wallet Credit</h3>
            <p className="text-sm text-neutral-400">
              Available: {formatCurrency(walletBalance / 100)}
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isUsingWallet}
            onChange={onToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {isUsingWallet && (
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Amount to apply:</span>
            <span className="text-blue-400 font-medium">
              -{formatCurrency(walletCreditAmount / 100)}
            </span>
          </div>

          {maxWalletCredit > 100 && (
            <div className="space-y-2">
              <input
                type="range"
                min={100}
                max={maxWalletCredit}
                step={100}
                value={walletCreditAmount || 100}
                onChange={handleSliderChange}
                className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-neutral-500">
                <span>{formatCurrency(1)}</span>
                <span>{formatCurrency(maxWalletCredit / 100)}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-blue-700/30">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">
                Remaining to pay by card:
              </span>
              <span className="text-neutral-200 font-medium">
                {formatCurrency(remainingToPay)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
