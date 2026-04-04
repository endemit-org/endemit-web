import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToUser } from "@/lib/services/supabase/broadcast";
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
    // Get current wallet with lock (include userId for broadcasting)
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

    return { transaction, userId: wallet.userId };
  });

  const serializedTransaction: SerializedWalletTransaction = {
    id: result.transaction.id,
    walletId: result.transaction.walletId,
    type: result.transaction.type,
    amount: result.transaction.amount,
    balanceAfter: result.transaction.balanceAfter,
    note: result.transaction.note,
    createdById: result.transaction.createdById,
    createdAt: result.transaction.createdAt.toISOString(),
    createdBy: result.transaction.createdBy,
  };

  // Broadcast real-time update to the wallet owner
  // Fire and forget - don't block the response on broadcast
  broadcastToUser(result.userId, "wallet_transaction_created", {
    transactionId: serializedTransaction.id,
    walletId: serializedTransaction.walletId,
    type: serializedTransaction.type,
    amount: serializedTransaction.amount,
    balanceAfter: serializedTransaction.balanceAfter,
    note: serializedTransaction.note,
    createdAt: serializedTransaction.createdAt,
  }).catch(err => {
    console.error("Failed to broadcast wallet transaction:", err);
  });

  return serializedTransaction;
};
