"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createTransaction } from "@/domain/wallet/operations/createTransaction";
import { notifyOnPosTransaction } from "@/domain/notification/operations/notifyOnPosTransaction";
import { prisma } from "@/lib/services/prisma";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";

interface AddWalletCreditInput {
  walletId: string;
  amount: number;
  note?: string;
}

export async function addWalletCreditAction(
  input: AddWalletCreditInput
): Promise<SerializedWalletTransaction> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.WALLETS_MANAGE_BALANCE),
    "User not authorized to manage wallet balance"
  );

  assert(input.amount > 0, "Amount must be positive");

  const transaction = await createTransaction({
    walletId: input.walletId,
    type: "CREDIT",
    amount: input.amount,
    note: input.note,
    createdById: user.id,
  });

  // Get wallet owner info for notification
  const wallet = await prisma.wallet.findUnique({
    where: { id: input.walletId },
    include: { user: { select: { name: true, email: true } } },
  });

  // Notify Discord
  notifyOnPosTransaction({
    type: "ADMIN_CREDIT",
    amount: input.amount,
    balanceAfter: transaction.balanceAfter,
    note: input.note,
    userName: wallet?.user.name,
    userEmail: wallet?.user.email,
    adminName: user.name || user.username,
  }).catch(() => {}); // Fire and forget

  return transaction;
}
