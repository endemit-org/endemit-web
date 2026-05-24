import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { Prisma } from "@prisma/client";

export type StickerListFilter = "all" | "claimed" | "unclaimed";

export interface ListStickersInput {
  filter?: StickerListFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface StickerListItem {
  code: string;
  userId: string | null;
  claimedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
  } | null;
}

export interface ListStickersResult {
  items: StickerListItem[];
  total: number;
  claimedCount: number;
  unclaimedCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 50;

export async function listStickers(
  input: ListStickersInput = {}
): Promise<ListStickersResult> {
  const filter = input.filter ?? "all";
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, input.pageSize ?? DEFAULT_PAGE_SIZE));
  const search = input.search?.trim();

  const where: Prisma.StickerCodeWhereInput = {};
  if (filter === "claimed") where.userId = { not: null };
  if (filter === "unclaimed") where.userId = null;

  if (search) {
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      {
        user: {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [items, total, claimedCount, unclaimedCount] = await Promise.all([
    prisma.stickerCode.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true, name: true },
        },
      },
      orderBy: [{ claimedAt: "desc" }, { code: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.stickerCode.count({ where }),
    prisma.stickerCode.count({ where: { userId: { not: null } } }),
    prisma.stickerCode.count({ where: { userId: null } }),
  ]);

  return {
    items: items.map(s => ({
      code: s.code,
      userId: s.userId,
      claimedAt: s.claimedAt,
      createdAt: s.createdAt,
      user: s.user,
    })),
    total,
    claimedCount,
    unclaimedCount,
    page,
    pageSize,
  };
}
