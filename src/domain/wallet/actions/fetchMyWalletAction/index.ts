"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import type { SerializedWalletWithTransactions } from "@/domain/wallet/types";

export async function fetchMyWalletAction(): Promise<SerializedWalletWithTransactions | null> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");

  return await getWalletByUserId(user.id);
}
