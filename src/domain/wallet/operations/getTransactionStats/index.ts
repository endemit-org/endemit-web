import "server-only";

import { prisma } from "@/lib/services/prisma";

export interface TransactionStats {
  totalCredits: number;
  totalDebits: number;
  transactionCount: number;
}

export const getTransactionStats = async (): Promise<TransactionStats> => {
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
