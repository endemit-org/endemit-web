import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { CacheTags } from "@/lib/services/cache";

export interface TransactionStats {
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
}

const getTransactionStatsUncached = async (): Promise<TransactionStats> => {
  const [credits, debits, count] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { type: { in: ["CREDIT", "REFUND"] } },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: { in: ["DEBIT", "PURCHASE"] } },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.count(),
  ]);

  return {
    totalCredits: credits._sum.amount ?? 0,
    totalDebits: Math.abs(debits._sum.amount ?? 0),
    transactionCount: count,
  };
};

/**
 * Get transaction statistics (cached)
 */
export const getTransactionStats = (): Promise<TransactionStats> => {
  return unstable_cache(getTransactionStatsUncached, ["admin-transaction-stats"], {
    tags: [CacheTags.admin.wallets.transactionStats()],
  })();
};
