import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { CreateTransactionInput, SerializedWalletTransaction } from "@/domain/wallet/types";
import type { WalletTransactionType } from "@prisma/client";

const CREDIT_TYPES: WalletTransactionType[] = ["CREDIT", "REFUND"];
const DEBIT_TYPES: WalletTransactionType[] = ["DEBIT", "PURCHASE"];

export const createTransaction = async (
  input: CreateTransactionInput
): Promise<SerializedWalletTransaction> => {
  const { walletId, type, amount, note, createdById } = input;

  // Validate amount sign based on type
  if (CREDIT_TYPES.includes(type) && amount <= 0) {
    throw new Error(`${type} transactions must have a positive amount`);
  }
  if (DEBIT_TYPES.includes(type) && amount >= 0) {
    throw new Error(`${type} transactions must have a negative amount`);
  }

  // Use a transaction to ensure atomicity
  const result = await prisma.$transaction(async tx => {
    // Get current wallet with lock
    const wallet = await tx.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Calculate new balance
    const newBalance = wallet.balance + amount;

    // Check for negative balance (not allowed)
    if (newBalance < 0) {
      throw new Error("Insufficient wallet balance");
    }

    // Create the transaction
    const transaction = await tx.walletTransaction.create({
      data: {
        walletId,
        type,
        amount,
        balanceAfter: newBalance,
        note: note || null,
        createdById: createdById || null,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    // Update wallet balance
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });

    return transaction;
  });

  return {
    id: result.id,
    walletId: result.walletId,
    type: result.type,
    amount: result.amount,
    balanceAfter: result.balanceAfter,
    note: result.note,
    createdById: result.createdById,
    createdAt: result.createdAt.toISOString(),
    createdBy: result.createdBy,
  };
};
