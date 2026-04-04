import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToUser } from "@/lib/services/supabase/broadcast";

interface ProcessCashTopupInput {
  registerId: string;
  sellerId: string;
  customerWalletId: string;
  amount: number; // In cents
}

export async function processCashTopup(input: ProcessCashTopupInput) {
  const { registerId, sellerId, customerWalletId, amount } = input;

  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Verify register can do top-ups
  const register = await prisma.posRegister.findUnique({
    where: { id: registerId },
    include: {
      sellers: true,
    },
  });

  if (!register || register.status !== "ACTIVE") {
    throw new Error("Register not found or inactive");
  }

  if (!register.canTopUp) {
    throw new Error("This register cannot process top-ups");
  }

  // Verify seller is assigned
  const isSellerAssigned = register.sellers.some(s => s.userId === sellerId);
  if (!isSellerAssigned) {
    throw new Error("Seller not assigned to this register");
  }

  // Process top-up in transaction
  const result = await prisma.$transaction(async tx => {
    const wallet = await tx.wallet.findUnique({
      where: { id: customerWalletId },
      include: { user: true },
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const newBalance = wallet.balance + amount;

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CASH_TOPUP",
        amount: amount,
        balanceAfter: newBalance,
        note: `Cash top-up at ${register.name}`,
        createdById: sellerId,
      },
    });

    return { wallet, transaction, user: wallet.user };
  });

  // Broadcast wallet transaction to customer (updates both balance and transaction list)
  await broadcastToUser(result.user.id, "wallet_transaction_created", {
    transactionId: result.transaction.id,
    walletId: result.wallet.id,
    type: result.transaction.type,
    amount: result.transaction.amount,
    balanceAfter: result.transaction.balanceAfter,
    note: result.transaction.note,
    createdAt: result.transaction.createdAt.toISOString(),
  });

  return {
    success: true,
    transaction: result.transaction,
    newBalance: result.transaction.balanceAfter,
  };
}
