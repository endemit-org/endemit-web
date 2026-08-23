import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { CacheTags } from "@/lib/services/cache";

export interface WalletStats {
  totalBalance: number;
  walletCount: number;
  fundedWalletCount: number;
  transactionCount: number;
}

const getWalletStatsUncached = async (): Promise<WalletStats> => {
  const [balanceAgg, fundedWalletCount, transactionCount] = await Promise.all([
    prisma.wallet.aggregate({
      _sum: { balance: true },
      _count: true,
    }),
    prisma.wallet.count({ where: { balance: { gt: 0 } } }),
    prisma.walletTransaction.count(),
  ]);

  return {
    totalBalance: balanceAgg._sum.balance ?? 0,
    walletCount: balanceAgg._count,
    fundedWalletCount,
    transactionCount,
  };
};

/**
 * Get wallet statistics (cached)
 */
export const getWalletStats = (): Promise<WalletStats> => {
  return unstable_cache(getWalletStatsUncached, ["admin-wallet-stats"], {
    tags: [CacheTags.admin.wallets.stats()],
  })();
};
