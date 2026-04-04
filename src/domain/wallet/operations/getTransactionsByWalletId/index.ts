import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { SerializedWalletTransaction } from "@/domain/wallet/types";
import { DEFAULT_PAGE_SIZE, calculatePagination } from "@/lib/types/pagination";

interface GetTransactionsByWalletIdParams {
  walletId: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedWalletTransactions {
  transactions: SerializedWalletTransaction[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getTransactionsByWalletId = async ({
  walletId,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetTransactionsByWalletIdParams): Promise<PaginatedWalletTransactions> => {
  const where = { walletId };

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
    })),
    totalCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};
