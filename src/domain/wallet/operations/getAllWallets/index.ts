import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import type { PaginatedWallets } from "@/domain/wallet/types";
import { DEFAULT_PAGE_SIZE, calculatePagination } from "@/lib/types/pagination";
import { CacheTags } from "@/lib/services/cache";

export type WalletSortBy = "updatedAt" | "balance" | "transactions";
export type WalletSortDir = "asc" | "desc";

interface GetAllWalletsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: WalletSortBy;
  sortDir?: WalletSortDir;
}

const getAllWalletsUncached = async (
  params: GetAllWalletsParams = {}
): Promise<PaginatedWallets> => {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search,
    sortBy = "updatedAt",
    sortDir = "desc",
  } = params;
  const where = search
    ? {
        user: {
          OR: [
            { username: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        },
      }
    : {};

  const totalCount = await prisma.wallet.count({ where });
  const pagination = calculatePagination(totalCount, page, pageSize);

  const orderBy =
    sortBy === "transactions"
      ? { transactions: { _count: sortDir } }
      : sortBy === "balance"
        ? { balance: sortDir }
        : { updatedAt: sortDir };

  const wallets = await prisma.wallet.findMany({
    where,
    skip: pagination.skip,
    take: pagination.take,
    orderBy,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  return {
    wallets: wallets.map(wallet => ({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      transactionCount: wallet._count.transactions,
      createdAt: wallet.createdAt.toISOString(),
      updatedAt: wallet.updatedAt.toISOString(),
      user: wallet.user,
    })),
    totalCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};

/**
 * Get all wallets (cached)
 */
export const getAllWallets = (
  params: GetAllWalletsParams = {}
): Promise<PaginatedWallets> => {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = "",
    sortBy = "updatedAt",
    sortDir = "desc",
  } = params;

  return unstable_cache(
    () => getAllWalletsUncached(params),
    ["admin-wallets", String(page), String(pageSize), search, sortBy, sortDir],
    { tags: [CacheTags.admin.wallets.list()] }
  )();
};
