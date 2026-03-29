"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchMyWalletAction } from "@/domain/wallet/actions/fetchMyWalletAction";

const MIN_CARD_PAYMENT = 100; // 1 EUR in cents

interface UseWalletCreditOptions {
  total: number; // Total in EUR (not cents)
  enabled?: boolean;
}

interface UseWalletCreditReturn {
  walletBalance: number; // Balance in cents
  walletCreditAmount: number; // Amount to use in cents
  walletCreditEur: number; // Amount to use in EUR
  maxWalletCredit: number; // Maximum usable in cents
  remainingToPay: number; // Remaining to pay in EUR
  isLoading: boolean;
  error: string | null;
  canUseWallet: boolean;
  isUsingWallet: boolean;
  setWalletCreditAmount: (amount: number) => void;
  toggleWalletCredit: () => void;
  resetWalletCredit: () => void;
}

export function useWalletCredit({
  total,
  enabled = true,
}: UseWalletCreditOptions): UseWalletCreditReturn {
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletCreditAmount, setWalletCreditAmountState] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert total to cents for calculations
  const totalCents = Math.round(total * 100);

  // Calculate maximum wallet credit (total - minimum card payment)
  const maxWalletCredit = useMemo(() => {
    if (totalCents <= MIN_CARD_PAYMENT) {
      return 0; // Can't use wallet if total is already at minimum
    }
    // Max is either wallet balance or (total - minimum card payment), whichever is less
    const maxUsable = totalCents - MIN_CARD_PAYMENT;
    return Math.min(walletBalance, maxUsable);
  }, [totalCents, walletBalance]);

  // Can user use wallet credit?
  const canUseWallet = walletBalance > 0 && maxWalletCredit > 0;

  // Is wallet credit currently being used?
  const isUsingWallet = walletCreditAmount > 0;

  // Remaining to pay (in EUR)
  const remainingToPay = (totalCents - walletCreditAmount) / 100;

  // Wallet credit in EUR
  const walletCreditEur = walletCreditAmount / 100;

  // Fetch wallet balance
  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchMyWalletAction();
        setWalletBalance(result?.balance ?? 0);
      } catch {
        // User might not be logged in - that's fine
        setWalletBalance(0);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [enabled]);

  // Reset credit amount when total changes and current amount would be invalid
  useEffect(() => {
    if (walletCreditAmount > maxWalletCredit) {
      setWalletCreditAmountState(maxWalletCredit);
    }
  }, [maxWalletCredit, walletCreditAmount]);

  const setWalletCreditAmount = useCallback(
    (amount: number) => {
      // Clamp to valid range
      const clampedAmount = Math.max(0, Math.min(amount, maxWalletCredit));
      setWalletCreditAmountState(clampedAmount);
    },
    [maxWalletCredit]
  );

  const toggleWalletCredit = useCallback(() => {
    if (walletCreditAmount > 0) {
      setWalletCreditAmountState(0);
    } else {
      setWalletCreditAmountState(maxWalletCredit);
    }
  }, [walletCreditAmount, maxWalletCredit]);

  const resetWalletCredit = useCallback(() => {
    setWalletCreditAmountState(0);
  }, []);

  return {
    walletBalance,
    walletCreditAmount,
    walletCreditEur,
    maxWalletCredit,
    remainingToPay,
    isLoading,
    error,
    canUseWallet,
    isUsingWallet,
    setWalletCreditAmount,
    toggleWalletCredit,
    resetWalletCredit,
  };
}
