"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { getAllWallets } from "@/domain/wallet/operations/getAllWallets";
import type { PaginatedWallets } from "@/domain/wallet/types";

export async function fetchWalletsAction(
  page: number = 1,
  search?: string
): Promise<PaginatedWallets> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.WALLETS_READ),
    "User not authorized to view wallets"
  );

  return await getAllWallets({ page, search });
}
