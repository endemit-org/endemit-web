import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";

export const getTransactionById = async (
  transactionId: string
): Promise<(SerializedWalletTransaction & { wallet: { userId: string } }) | null> => {
  const transaction = await prisma.walletTransaction.findUnique({
    where: {
      id: transactionId,
    },
    include: {
      wallet: {
        select: {
          userId: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,
    walletId: transaction.walletId,
    type: transaction.type,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    note: transaction.note,
    createdById: transaction.createdById,
    createdAt: transaction.createdAt.toISOString(),
    createdBy: transaction.createdBy,
    wallet: {
      userId: transaction.wallet.userId,
    },
  };
};
