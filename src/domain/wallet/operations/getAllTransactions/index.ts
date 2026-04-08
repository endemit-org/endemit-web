import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import type { PaginatedTransactions } from "@/domain/wallet/types";
import type { WalletTransactionType } from "@prisma/client";
import { DEFAULT_PAGE_SIZE, calculatePagination } from "@/lib/types/pagination";
import { CacheTags } from "@/lib/services/cache";

interface GetAllTransactionsParams {
  page?: number;
  pageSize?: number;
  type?: WalletTransactionType;
  search?: string;
}

const getAllTransactionsUncached = async (
  params: GetAllTransactionsParams = {}
): Promise<PaginatedTransactions> => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, type, search } = params;
  const where: Record<string, unknown> = {};

  if (type) {
    where.type = type;
  }

  if (search) {
    where.wallet = {
      user: {
        OR: [
          { username: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      },
    };
  }

  const totalCount = await prisma.walletTransaction.count({ where });
  const pagination = calculatePagination(totalCount, page, pageSize);

  const transactions = await prisma.walletTransaction.findMany({
    where,
    skip: pagination.skip,
    take: pagination.take,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      wallet: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    transactions: transactions.map(tx => ({
      id: tx.id,
      walletId: tx.walletId,
      type: tx.type,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      note: tx.note,
      createdById: tx.createdById,
      createdAt: tx.createdAt.toISOString(),
      createdBy: tx.createdBy,
      wallet: tx.wallet,
    })),
    totalCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};

/**
 * Get all transactions (cached)
 */
export const getAllTransactions = (
  params: GetAllTransactionsParams = {}
): Promise<PaginatedTransactions> => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, type = "", search = "" } = params;

  return unstable_cache(
    () => getAllTransactionsUncached(params),
    ["admin-transactions", String(page), String(pageSize), type, search],
    { tags: [CacheTags.admin.wallets.transactions()] }
  )();
};
