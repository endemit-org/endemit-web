import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { bustOnPosOrderCreated } from "@/lib/services/cache";
import type { ScanPosOrderResult } from "@/domain/pos/types";

export async function scanPosOrder(
  code: string,
  customerId: string
): Promise<ScanPosOrderResult> {
  // Determine if this is a short code (4 chars, 2 letters + 2 numbers) or hash
  const isShortCode = /^[A-Z]{2}[0-9]{2}$/i.test(code.trim());

  const orderQuery = isShortCode
    ? prisma.posOrder.findFirst({
        where: {
          shortCode: code.trim().toUpperCase(),
          status: "PENDING",
        },
        include: {
          items: { include: { item: true } },
          register: true,
        },
      })
    : prisma.posOrder.findUnique({
        where: { orderHash: code },
        include: {
          items: { include: { item: true } },
          register: true,
        },
      });

  // Independent reads — run concurrently on separate connections
  const [order, customer] = await Promise.all([
    orderQuery,
    prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        wallet: { select: { balance: true } },
      },
    }),
  ]);

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== "PENDING") {
    throw new Error(`Order is ${order.status.toLowerCase()}`);
  }

  if (new Date() > order.expiresAt) {
    // Mark as cancelled due to expiry
    await prisma.posOrder.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: "expired",
      },
    });
    throw new Error("Order has expired");
  }

  if (!customer) {
    throw new Error("Customer not found");
  }

  const balance = Number(customer.wallet?.balance ?? 0);
  const hasEnoughBalance = balance >= order.total;
  const customerFirstName = customer.name?.split(" ")[0] || null;

  // Update order with scan info
  await prisma.posOrder.update({
    where: { id: order.id },
    data: {
      customerId,
      scannedAt: new Date(),
    },
  });

  // Announce after the response is sent.
  after(async () => {
    await Promise.all([
      broadcastToChannel(
        `pos:register:${order.registerId}`,
        "pos_order_scanned",
        {
          orderId: order.id,
          shortCode: order.shortCode,
          customerId,
          customerName: customer.name || customer.email || "Unknown",
          customerFirstName,
          customerImage: customer.image,
          balance,
          hasEnoughBalance,
        }
      ),
      bustOnPosOrderCreated(),
    ]);
  });

  return {
    order,
    customer: {
      id: customer.id,
      name: customer.name,
      balance,
    },
    hasEnoughBalance,
  };
}
