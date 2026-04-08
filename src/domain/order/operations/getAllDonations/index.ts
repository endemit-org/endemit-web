import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { OrderStatus, Prisma } from "@prisma/client";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
} from "@/lib/types/pagination";
import { CacheTags } from "@/lib/services/cache";

// Statuses that represent successful payment
const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.IN_DELIVERY,
  OrderStatus.COMPLETED,
  OrderStatus.REFUND_REQUESTED,
  OrderStatus.PARTIALLY_REFUNDED,
];

export interface DonationItem {
  orderId: string;
  orderEmail: string;
  orderName: string | null;
  amount: number;
  createdAt: string;
}

export interface PaginatedDonations {
  donations: DonationItem[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface GetAllDonationsParams {
  page?: number;
  pageSize?: number;
}

const getAllDonationsUncached = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetAllDonationsParams = {}): Promise<PaginatedDonations> => {
  // Use raw query to filter orders containing donations in JSON items array
  // This is more efficient than fetching all orders and filtering in memory
  const ordersWithDonations = await prisma.$queryRaw<
    Array<{
      id: string;
      email: string;
      name: string | null;
      items: Prisma.JsonValue;
      createdAt: Date;
    }>
  >`
    SELECT id, email, name, items, "createdAt"
    FROM "Order"
    WHERE status = ANY(${PAID_STATUSES}::text[]::"OrderStatus"[])
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(items) AS item
      WHERE item->>'category' = ${ProductCategory.DONATIONS}
    )
    ORDER BY "createdAt" DESC
    LIMIT 2000
  `;

  // Extract all donations from filtered orders
  const allDonations: DonationItem[] = [];
  let totalAmount = 0;

  for (const order of ordersWithDonations) {
    const items = order.items as unknown as ProductInOrder[];

    for (const item of items) {
      if (item.category === ProductCategory.DONATIONS) {
        const donationAmount = item.price * item.quantity;
        totalAmount += donationAmount;
        allDonations.push({
          orderId: order.id,
          orderEmail: order.email,
          orderName: order.name,
          amount: donationAmount,
          createdAt: order.createdAt.toISOString(),
        });
      }
    }
  }

  // Apply pagination to extracted donations
  const totalCount = allDonations.length;
  const pagination = calculatePagination(totalCount, page, pageSize);
  const paginatedDonations = allDonations.slice(
    pagination.skip,
    pagination.skip + pagination.take
  );

  return {
    donations: paginatedDonations,
    totalCount,
    totalAmount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};

/**
 * Get all donations (cached)
 */
export const getAllDonations = (
  params: GetAllDonationsParams = {}
): Promise<PaginatedDonations> => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  return unstable_cache(
    () => getAllDonationsUncached(params),
    ["admin-donations", String(page), String(pageSize)],
    { tags: [CacheTags.admin.orders.donations()] }
  )();
};
