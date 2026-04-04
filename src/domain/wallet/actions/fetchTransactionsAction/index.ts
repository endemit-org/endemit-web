"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllTransactions } from "@/domain/wallet/operations/getAllTransactions";
import type { PaginatedTransactions } from "@/domain/wallet/types";
import type { WalletTransactionType } from "@prisma/client";

export async function fetchTransactionsAction(
  page: number = 1,
  type?: WalletTransactionType,
  search?: string
): Promise<PaginatedTransactions> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TRANSACTIONS_READ),
    "User not authorized to view transactions"
  );

  return await getAllTransactions({ page, type, search });
}
