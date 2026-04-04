import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { PaginatedWallets } from "@/domain/wallet/types";
import { DEFAULT_PAGE_SIZE, calculatePagination } from "@/lib/types/pagination";

interface GetAllWalletsParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const getAllWallets = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
}: GetAllWalletsParams = {}): Promise<PaginatedWallets> => {
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

  const wallets = await prisma.wallet.findMany({
    where,
    skip: pagination.skip,
    take: pagination.take,
    orderBy: { updatedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return {
    wallets: wallets.map(wallet => ({
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
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
