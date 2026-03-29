import "server-only";

import { prisma } from "@/lib/services/prisma";

export interface WalletStats {
  totalBalance: number;
  walletCount: number;
  transactionCount: number;
}

export const getWalletStats = async (): Promise<WalletStats> => {
  const [balanceAgg, transactionCount] = await Promise.all([
    prisma.wallet.aggregate({
      _sum: { balance: true },
      _count: true,
    }),
    prisma.walletTransaction.count(),
  ]);

  return {
    totalBalance: balanceAgg._sum.balance ?? 0,
    walletCount: balanceAgg._count,
    transactionCount,
  };
};
