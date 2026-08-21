import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import type { PosOrderStatus, PosPaymentMethod } from "@prisma/client";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
} from "@/lib/types/pagination";
import { CacheTags } from "@/lib/services/cache";

export interface PosOrderWithRelations {
  id: string;
  orderHash: string;
  shortCode: string;
  subtotal: number;
  tipAmount: number;
  total: number;
  status: PosOrderStatus;
  paymentMethod: PosPaymentMethod | null;
  scannedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  expiresAt: string;
  createdAt: string;
  register: {
    id: string;
    name: string;
  };
  seller: {
    id: string;
    name: string | null;
    email: string | null;
  };
  customer: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitCost: number;
    total: number;
  }>;
}

export interface GetAllPosOrdersParams {
  page?: number;
  pageSize?: number;
  status?: PosOrderStatus;
  registerId?: string;
  paymentMethod?: PosPaymentMethod;
  /** Matches order short code, customer name or customer email (partial, case-insensitive). */
  search?: string;
}

export interface GetAllPosOrdersResult {
  orders: PosOrderWithRelations[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function getAllPosOrdersUncached({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  status,
  registerId,
  paymentMethod,
  search,
}: GetAllPosOrdersParams = {}): Promise<GetAllPosOrdersResult> {
  const searchTerm = search?.trim();
  const where = {
    ...(status && { status }),
    ...(registerId && { registerId }),
    ...(paymentMethod && { paymentMethod }),
    ...(searchTerm && {
      OR: [
        { shortCode: { contains: searchTerm, mode: "insensitive" as const } },
        {
          customer: {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" as const } },
              { email: { contains: searchTerm, mode: "insensitive" as const } },
            ],
          },
        },
      ],
    }),
  };

  const totalCount = await prisma.posOrder.count({ where });
  const pagination = calculatePagination(totalCount, page, pageSize);

  const orders = await prisma.posOrder.findMany({
    where,
    skip: pagination.skip,
    take: pagination.take,
    orderBy: { createdAt: "desc" },
    include: {
      register: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unitCost: true,
          total: true,
        },
      },
    },
  });

  const serializedOrders: PosOrderWithRelations[] = orders.map(order => ({
    id: order.id,
    orderHash: order.orderHash,
    shortCode: order.shortCode,
    subtotal: order.subtotal,
    tipAmount: order.tipAmount,
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    scannedAt: order.scannedAt?.toISOString() ?? null,
    paidAt: order.paidAt?.toISOString() ?? null,
    cancelledAt: order.cancelledAt?.toISOString() ?? null,
    cancelReason: order.cancelReason,
    expiresAt: order.expiresAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    register: order.register,
    seller: order.seller,
    customer: order.customer,
    items: order.items,
  }));

  return {
    orders: serializedOrders,
    totalCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
}

/**
 * Get all POS orders (cached)
 */
export function getAllPosOrders(
  params: GetAllPosOrdersParams = {}
): Promise<GetAllPosOrdersResult> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    status = "",
    registerId = "",
    paymentMethod = "",
    search = "",
  } = params;

  return unstable_cache(
    () => getAllPosOrdersUncached(params),
    ["admin-pos-orders", String(page), String(pageSize), status, registerId, paymentMethod, search.trim().toLowerCase()],
    { tags: [CacheTags.admin.pos.orders()] }
  )();
}
