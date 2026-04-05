import "server-only";

import { prisma } from "@/lib/services/prisma";
import { OrderStatus } from "@prisma/client";
import { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";

// Statuses that represent successful payment
const PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.IN_DELIVERY,
  OrderStatus.COMPLETED,
  OrderStatus.REFUND_REQUESTED,
  OrderStatus.PARTIALLY_REFUNDED,
];

export interface DonorDonation {
  orderId: string;
  amount: number;
  createdAt: string;
}

export interface AggregatedDonor {
  email: string;
  name: string | null;
  totalAmount: number;
  donationCount: number;
  firstDonation: string;
  lastDonation: string;
  donations: DonorDonation[];
}

export interface AggregatedDonorsResult {
  donors: AggregatedDonor[];
  totalDonors: number;
  totalAmount: number;
  totalDonations: number;
}

export const getAggregatedDonors = async (): Promise<AggregatedDonorsResult> => {
  // Fetch all paid orders to extract donations
  const completedOrders = await prisma.order.findMany({
    where: {
      status: { in: PAID_STATUSES },
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

  // Group donations by email
  const donorMap = new Map<string, {
    email: string;
    name: string | null;
    totalAmount: number;
    donations: DonorDonation[];
  }>();

  let totalAmount = 0;
  let totalDonations = 0;

  for (const order of completedOrders) {
    const items = order.items as unknown as ProductInOrder[];

    for (const item of items) {
      if (item.category === ProductCategory.DONATIONS) {
        const donationAmount = item.price * item.quantity;
        totalAmount += donationAmount;
        totalDonations++;

        const emailKey = order.email.toLowerCase();
        const existing = donorMap.get(emailKey);

        const donation: DonorDonation = {
          orderId: order.id,
          amount: donationAmount,
          createdAt: order.createdAt.toISOString(),
        };

        if (existing) {
          existing.totalAmount += donationAmount;
          existing.donations.push(donation);
          // Update name if we have one and existing doesn't
          if (!existing.name && order.name) {
            existing.name = order.name;
          }
        } else {
          donorMap.set(emailKey, {
            email: order.email,
            name: order.name,
            totalAmount: donationAmount,
            donations: [donation],
          });
        }
      }
    }
  }

  // Convert map to array with computed fields and sort by highest total
  const donors: AggregatedDonor[] = Array.from(donorMap.values())
    .map(donor => {
      // Sort donations by date (newest first)
      const sortedDonations = donor.donations.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        email: donor.email,
        name: donor.name,
        totalAmount: donor.totalAmount,
        donationCount: donor.donations.length,
        firstDonation: sortedDonations[sortedDonations.length - 1].createdAt,
        lastDonation: sortedDonations[0].createdAt,
        donations: sortedDonations,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount); // Sort by highest total first

  return {
    donors,
    totalDonors: donors.length,
    totalAmount,
    totalDonations,
  };
};
