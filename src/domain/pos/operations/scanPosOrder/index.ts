import "server-only";

import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import type { ScanPosOrderResult } from "@/domain/pos/types";

export async function scanPosOrder(
  code: string,
  customerId: string
): Promise<ScanPosOrderResult> {
  // Determine if this is a short code (4 chars, 2 letters + 2 numbers) or hash
  const isShortCode = /^[A-Z]{2}[0-9]{2}$/i.test(code.trim());

  let order;

  if (isShortCode) {
    // For short codes, only search active (PENDING) orders
    order = await prisma.posOrder.findFirst({
      where: {
        shortCode: code.trim().toUpperCase(),
        status: "PENDING",
      },
      include: {
        items: {
          include: { item: true },
        },
        register: true,
      },
    });
  } else {
    // For hash, find by exact match
    order = await prisma.posOrder.findUnique({
      where: { orderHash: code },
      include: {
        items: {
          include: { item: true },
        },
        register: true,
      },
    });
  }

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

  // Get customer wallet
  const customer = await prisma.user.findUnique({
    where: { id: customerId },
    include: { wallet: true },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  const balance = customer.wallet?.balance ?? 0;
  const hasEnoughBalance = balance >= order.total;

  // Update order with scan info
  await prisma.posOrder.update({
    where: { id: order.id },
    data: {
      customerId,
      scannedAt: new Date(),
    },
  });

  // Broadcast to seller
  await broadcastToChannel(`pos:register:${order.registerId}`, "pos_order_scanned", {
    orderId: order.id,
    shortCode: order.shortCode,
    customerId,
    customerName: customer.name || customer.email || "Unknown",
    balance,
    hasEnoughBalance,
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
