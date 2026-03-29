import "server-only";

import { prisma } from "@/lib/services/prisma";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
} from "@/lib/types/pagination";

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

export const getAllDonations = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetAllDonationsParams = {}): Promise<PaginatedDonations> => {
  // Fetch all completed orders to extract donations
  const completedOrders = await prisma.order.findMany({
    where: {
      status: "PAID",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      email: true,
      name: true,
      items: true,
      createdAt: true,
    },
  });

  // Extract all donations from orders
  const allDonations: DonationItem[] = [];
  let totalAmount = 0;

  for (const order of completedOrders) {
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
