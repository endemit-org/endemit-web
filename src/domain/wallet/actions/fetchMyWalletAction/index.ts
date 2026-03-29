"use server";

import { getCurrentUser } from "@/lib/services/auth";
import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import type { SerializedWalletWithTransactions } from "@/domain/wallet/types";

export async function fetchMyWalletAction(): Promise<SerializedWalletWithTransactions | null> {
  const user = await getCurrentUser();

  // Return null if user is not authenticated (guest checkout)
  if (!user) {
    return null;
  }

  return await getWalletByUserId(user.id);
}
