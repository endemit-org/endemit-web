import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { generatePosOrderHash } from "@/domain/pos/operations/generatePosOrderHash";
import { generatePosShortCode } from "@/domain/pos/operations/generatePosShortCode";
import type { CreatePosOrderInput } from "@/domain/pos/types";
import { bustOnPosOrderCreated } from "@/lib/services/cache";

const ORDER_EXPIRY_MINUTES = 15;

export async function createPosOrder(input: CreatePosOrderInput) {
  const { registerId, sellerId, items } = input;

  const itemIds = items.map(i => i.itemId);

  // Validate register+seller, fetch only the items being ordered, and pick a
  // short code — all in parallel on separate connections.
  const [register, registerItems, shortCode] = await Promise.all([
    prisma.posRegister.findUnique({
      where: { id: registerId },
      select: {
        status: true,
        sellers: {
          where: { userId: sellerId },
          select: { id: true },
        },
      },
    }),
    prisma.posRegisterItem.findMany({
      where: { registerId, itemId: { in: itemIds } },
      select: {
        itemId: true,
        item: {
          select: {
            id: true,
            name: true,
            cost: true,
            status: true,
          },
        },
      },
    }),
    generatePosShortCode(),
  ]);

  if (!register || register.status !== "ACTIVE") {
    throw new Error("Register not found or inactive");
  }

  if (register.sellers.length === 0) {
    throw new Error("Seller not assigned to this register");
  }

  const itemByItemId = new Map(registerItems.map(ri => [ri.itemId, ri.item]));

  const itemsToAdd: Array<{
    itemId: string;
    name: string;
    quantity: number;
    unitCost: number;
    total: number;
  }> = [];

  let subtotal = 0;

  for (const orderItem of items) {
    const item = itemByItemId.get(orderItem.itemId);

    if (!item) {
      throw new Error(`Item ${orderItem.itemId} not available at this register`);
    }

    if (item.status !== "ACTIVE") {
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

  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000);

  // Hash entropy comes from the random salt inside generatePosOrderHash, so
  // we can compute it before insert and create the order in a single write.
  const orderHash = generatePosOrderHash({
    registerId,
    sellerId,
    subtotal,
    createdAt: createdAt.toISOString(),
  });

  const order = await prisma.posOrder.create({
    data: {
      shortCode,
      orderHash,
      registerId,
      sellerId,
      subtotal,
      total: subtotal,
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

  after(() => bustOnPosOrderCreated());

  return order;
}
