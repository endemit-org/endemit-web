"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { createTransaction } from "@/domain/wallet/operations/createTransaction";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";

interface DebitWalletInput {
  walletId: string;
  amount: number;
  note?: string;
}

export async function debitWalletAction(
  input: DebitWalletInput
): Promise<SerializedWalletTransaction> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.WALLETS_MANAGE_BALANCE),
    "User not authorized to manage wallet balance"
  );

  assert(input.amount > 0, "Amount must be positive");

  return await createTransaction({
    walletId: input.walletId,
    type: "DEBIT",
    amount: -input.amount,
    note: input.note,
    createdById: user.id,
  });
}
