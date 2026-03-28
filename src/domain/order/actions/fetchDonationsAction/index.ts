"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";

export interface DonationItem {
  orderId: string;
  orderEmail: string;
  orderName: string | null;
  amount: number;
  createdAt: string;
}

export interface DonationsData {
  donations: DonationItem[];
  totalAmount: number;
  count: number;
}

export async function fetchDonations(): Promise<DonationsData> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.ORDERS_READ_ALL),
    "User not authorized to read orders"
  );

  // Fetch completed orders (PAID status)
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

  const donations: DonationItem[] = [];
  let totalAmount = 0;

  for (const order of completedOrders) {
    const items = order.items as unknown as ProductInOrder[];

    for (const item of items) {
      if (item.category === ProductCategory.DONATIONS) {
        const donationAmount = item.price * item.quantity;
        totalAmount += donationAmount;
        donations.push({
          orderId: order.id,
          orderEmail: order.email,
          orderName: order.name,
          amount: donationAmount,
          createdAt: order.createdAt.toISOString(),
        });
      }
    }
  }

  return {
    donations,
    totalAmount,
    count: donations.length,
  };
}
