import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { SerializedWalletWithTransactions } from "@/domain/wallet/types";

export const getWalletByUserId = async (
  userId: string
): Promise<SerializedWalletWithTransactions | null> => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!wallet) {
    return null;
  }

  return {
    id: wallet.id,
    userId: wallet.userId,
    balance: wallet.balance,
    createdAt: wallet.createdAt.toISOString(),
    updatedAt: wallet.updatedAt.toISOString(),
    user: wallet.user,
    transactions: wallet.transactions.map(tx => ({
      id: tx.id,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      note: tx.note,
      createdById: tx.createdById,
      createdAt: tx.createdAt.toISOString(),
      createdBy: tx.createdBy,
    })),
  };
};
