"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { transferFunds } from "@/domain/wallet/operations/transferFunds";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";

interface AdminTransferFundsInput {
  senderUserId: string;
  recipientUserId: string;
  amount: number;
  idempotencyKey: string;
  note?: string;
}

export async function adminTransferFundsAction(
  input: AdminTransferFundsInput
): Promise<SerializedWalletTransaction> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.WALLETS_MANAGE_BALANCE),
    "User not authorized to manage wallet balance"
  );

  const result = await transferFunds({
    senderUserId: input.senderUserId,
    recipientUserId: input.recipientUserId,
    amount: input.amount,
    idempotencyKey: input.idempotencyKey,
    note: input.note,
    createdById: user.id,
  });

  return result.debit;
}
