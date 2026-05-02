import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";

export interface TransactionCounterparty {
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
}

export type TransactionDetail = SerializedWalletTransaction & {
  wallet: { userId: string };
  counterparty: TransactionCounterparty | null;
};

const counterpartyUserSelect = {
  id: true,
  username: true,
  name: true,
  image: true,
} as const;

export const getTransactionById = async (
  transactionId: string
): Promise<TransactionDetail | null> => {
  const transaction = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: {
      wallet: { select: { userId: true } },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      relatedTransaction: {
        include: {
          wallet: {
            select: {
              user: { select: counterpartyUserSelect },
            },
          },
        },
      },
      linkedFrom: {
        include: {
          wallet: {
            select: {
              user: { select: counterpartyUserSelect },
            },
          },
        },
      },
    },
  });

  if (!transaction) {
    return null;
  }

  let counterparty: TransactionCounterparty | null = null;
  if (transaction.type === "P2P_TRANSFER") {
    // Debit row: linkedFrom is the credit on the recipient's wallet.
    // Credit row: relatedTransaction is the debit on the sender's wallet.
    const otherWalletUser =
      transaction.linkedFrom?.wallet.user ??
      transaction.relatedTransaction?.wallet.user ??
      null;
    if (otherWalletUser) {
      counterparty = {
        userId: otherWalletUser.id,
        username: otherWalletUser.username,
        name: otherWalletUser.name,
        image: otherWalletUser.image,
      };
    }
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
    wallet: { userId: transaction.wallet.userId },
    counterparty,
  };
};
