import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { Prisma, EventClaimStatus } from "@prisma/client";

export type EventClaimListFilter = "all" | "PENDING" | "APPROVED";

export interface ListAllEventClaimsInput {
  filter?: EventClaimListFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface EventClaimListItem {
  id: string;
  eventId: string;
  eventName: string;
  status: EventClaimStatus;
  createdAt: Date;
  approvedAt: Date | null;
  user: {
    id: string;
    username: string;
    email: string | null;
    name: string | null;
  };
}

export interface ListAllEventClaimsResult {
  items: EventClaimListItem[];
  total: number;
  pendingCount: number;
  approvedCount: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 50;

export async function listAllEventClaims(
  input: ListAllEventClaimsInput = {}
): Promise<ListAllEventClaimsResult> {
  const filter = input.filter ?? "all";
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(
    1,
    Math.min(200, input.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const search = input.search?.trim();

  const where: Prisma.EventClaimWhereInput = {};
  if (filter === "PENDING" || filter === "APPROVED") {
    where.status = filter;
  }

  if (search) {
    where.OR = [
      { eventName: { contains: search, mode: "insensitive" } },
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

  const [items, total, pendingCount, approvedCount] = await Promise.all([
    prisma.eventClaim.findMany({
      where,
      include: {
        user: {
          select: { id: true, username: true, email: true, name: true },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.eventClaim.count({ where }),
    prisma.eventClaim.count({ where: { status: "PENDING" } }),
    prisma.eventClaim.count({ where: { status: "APPROVED" } }),
  ]);

  return {
    items: items.map(c => ({
      id: c.id,
      eventId: c.eventId,
      eventName: c.eventName,
      status: c.status,
      createdAt: c.createdAt,
      approvedAt: c.approvedAt,
      user: c.user,
    })),
    total,
    pendingCount,
    approvedCount,
    page,
    pageSize,
  };
}
