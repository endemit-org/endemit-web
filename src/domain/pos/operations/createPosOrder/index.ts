import "server-only";

import { prisma } from "@/lib/services/prisma";
import { generatePosOrderHash } from "@/domain/pos/operations/generatePosOrderHash";
import { generatePosShortCode } from "@/domain/pos/operations/generatePosShortCode";
import type { CreatePosOrderInput, PosOrderPayload } from "@/domain/pos/types";

const ORDER_EXPIRY_MINUTES = 15;

export async function createPosOrder(input: CreatePosOrderInput) {
  const { registerId, sellerId, items } = input;

  // Verify register exists and is active
  const register = await prisma.posRegister.findUnique({
    where: { id: registerId },
    include: {
      items: {
        include: { item: true },
      },
      sellers: true,
    },
  });

  if (!register || register.status !== "ACTIVE") {
    throw new Error("Register not found or inactive");
  }

  // Verify seller is assigned to this register
  const isSellerAssigned = register.sellers.some(s => s.userId === sellerId);
  if (!isSellerAssigned) {
    throw new Error("Seller not assigned to this register");
  }

  // Fetch items and validate they're assigned to this register
  const registerItemIds = new Set(register.items.map(ri => ri.itemId));
  const itemsToAdd: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitCost: number;
    total: number;
  }> = [];

  let subtotal = 0;

  for (const orderItem of items) {
    if (!registerItemIds.has(orderItem.itemId)) {
      throw new Error(`Item ${orderItem.itemId} not available at this register`);
    }

    const registerItem = register.items.find(ri => ri.itemId === orderItem.itemId);
    const item = registerItem?.item;

    if (!item || item.status !== "ACTIVE") {
      throw new Error(`Item ${orderItem.itemId} is not active`);
    }

    const itemTotal = item.cost * orderItem.quantity;
    subtotal += itemTotal;

    itemsToAdd.push({
      itemId: item.id,
      name: item.name,
      quantity: orderItem.quantity,
      unitCost: item.cost,
      total: itemTotal,
    });
  }

  // Generate short code and hash
  const shortCode = await generatePosShortCode();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000);

  // Create order first to get ID
  const order = await prisma.posOrder.create({
    data: {
      shortCode,
      orderHash: "temp", // Will update after generating hash
      registerId,
      sellerId,
      subtotal,
      total: subtotal, // Will be updated when tip is added
      expiresAt,
      items: {
        create: itemsToAdd,
      },
    },
    include: {
      items: {
        include: { item: true },
      },
      register: true,
    },
  });

  // Generate hash with order ID
  const payload: PosOrderPayload = {
    orderId: order.id,
    registerId,
    sellerId,
    subtotal,
    createdAt: createdAt.toISOString(),
  };

  const orderHash = generatePosOrderHash(payload);

  // Update order with hash
  const updatedOrder = await prisma.posOrder.update({
    where: { id: order.id },
    data: { orderHash },
    include: {
      items: {
        include: { item: true },
      },
      register: true,
    },
  });

  return updatedOrder;
}
