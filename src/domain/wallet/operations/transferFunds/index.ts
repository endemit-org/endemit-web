import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToUser } from "@/lib/services/supabase/broadcast";
import { bustOnTransactionCreated } from "@/lib/services/cache";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";
import { queueP2PTransferEmail } from "@/domain/wallet/operations/queueP2PTransferEmail";

const MAX_TRANSFER_CENTS = 1_000_000;

export interface TransferFundsInput {
  senderUserId: string;
  recipientUserId: string;
  amount: number;
  idempotencyKey: string;
  note?: string;
}

export interface TransferFundsResult {
  debit: SerializedWalletTransaction;
  credit: SerializedWalletTransaction;
  recipientUserId: string;
}

export async function transferFunds(
  input: TransferFundsInput
): Promise<TransferFundsResult> {
  const { senderUserId, recipientUserId, amount, idempotencyKey, note } = input;

  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("Amount must be a positive integer (cents)");
  }
  if (amount > MAX_TRANSFER_CENTS) {
    throw new Error("Amount exceeds the per-transfer limit");
  }
  if (senderUserId === recipientUserId) {
    throw new Error("You cannot send funds to yourself");
  }
  if (!idempotencyKey || idempotencyKey.length < 8) {
    throw new Error("Missing or invalid idempotency key");
  }

  const existing = await prisma.walletTransaction.findUnique({
    where: { idempotencyKey },
    include: { relatedTransaction: true },
  });
  if (existing) {
    if (!existing.relatedTransaction) {
      throw new Error("Transfer is in an inconsistent state");
    }
    return {
      debit: serialize(existing),
      credit: serialize(existing.relatedTransaction),
      recipientUserId,
    };
  }

  const result = await prisma.$transaction(async tx => {
    const [senderWallet, recipientWallet] = await Promise.all([
      tx.wallet.findUnique({ where: { userId: senderUserId } }),
      tx.wallet.findUnique({ where: { userId: recipientUserId } }),
    ]);

    if (!senderWallet) throw new Error("Sender wallet not found");
    if (!recipientWallet) throw new Error("Recipient wallet not found");

    if (senderWallet.balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const senderBalanceAfter = senderWallet.balance - amount;
    const recipientBalanceAfter = recipientWallet.balance + amount;

    const debit = await tx.walletTransaction.create({
      data: {
        walletId: senderWallet.id,
        type: "P2P_TRANSFER",
        amount: -amount,
        balanceAfter: senderBalanceAfter,
        note: note || null,
        createdById: senderUserId,
        idempotencyKey,
      },
    });

    const credit = await tx.walletTransaction.create({
      data: {
        walletId: recipientWallet.id,
        type: "P2P_TRANSFER",
        amount,
        balanceAfter: recipientBalanceAfter,
        note: note || null,
        createdById: senderUserId,
        relatedTransactionId: debit.id,
      },
    });

    await Promise.all([
      tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: senderBalanceAfter },
      }),
      tx.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: recipientBalanceAfter },
      }),
    ]);

    return { debit, credit, senderWalletId: senderWallet.id, recipientWalletId: recipientWallet.id };
  });

  await Promise.all([
    bustOnTransactionCreated(result.debit.id, senderUserId, result.senderWalletId),
    bustOnTransactionCreated(
      result.credit.id,
      recipientUserId,
      result.recipientWalletId
    ),
  ]);

  broadcastToUser(senderUserId, "wallet_transaction_created", {
    transactionId: result.debit.id,
    walletId: result.debit.walletId,
    type: result.debit.type,
    amount: result.debit.amount,
    balanceAfter: result.debit.balanceAfter,
    note: result.debit.note,
    createdAt: result.debit.createdAt.toISOString(),
  }).catch(err =>
    console.error("Failed to broadcast P2P debit:", err)
  );

  broadcastToUser(recipientUserId, "wallet_transaction_created", {
    transactionId: result.credit.id,
    walletId: result.credit.walletId,
    type: result.credit.type,
    amount: result.credit.amount,
    balanceAfter: result.credit.balanceAfter,
    note: result.credit.note,
    createdAt: result.credit.createdAt.toISOString(),
  }).catch(err =>
    console.error("Failed to broadcast P2P credit:", err)
  );

  queueP2PTransferEmail({
    debitTransactionId: result.debit.id,
    creditTransactionId: result.credit.id,
  }).catch(err => console.error("Failed to queue P2P transfer email:", err));

  return {
    debit: serialize(result.debit),
    credit: serialize(result.credit),
    recipientUserId,
  };
}

function serialize(
  tx: {
    id: string;
    walletId: string;
    type: string;
    amount: number;
    balanceAfter: number;
    note: string | null;
    createdById: string | null;
    createdAt: Date;
  }
): SerializedWalletTransaction {
  return {
    id: tx.id,
    walletId: tx.walletId,
    type: tx.type as SerializedWalletTransaction["type"],
    amount: tx.amount,
    balanceAfter: tx.balanceAfter,
    note: tx.note,
    createdById: tx.createdById,
    createdAt: tx.createdAt.toISOString(),
    createdBy: null,
  };
}
