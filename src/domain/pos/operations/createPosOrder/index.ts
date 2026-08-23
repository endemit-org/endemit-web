import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { generatePosOrderHash } from "@/domain/pos/operations/generatePosOrderHash";
import { generatePosShortCode } from "@/domain/pos/operations/generatePosShortCode";
import type { CreatePosOrderInput } from "@/domain/pos/types";
import { bustOnPosOrderCreated } from "@/lib/services/cache";

const ORDER_EXPIRY_MINUTES = 15;

export async function createPosOrder(input: CreatePosOrderInput) {
  const { registerId, sellerId, items, allowCreditItems = true, note, attachedCustomerId } = input;

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
            direction: true,
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
  let debitSubtotal = 0;

  for (const orderItem of items) {
    const item = itemByItemId.get(orderItem.itemId);

    if (!item) {
      throw new Error(`Item ${orderItem.itemId} not available at this register`);
    }

    if (item.status !== "ACTIVE") {
      throw new Error(`Item ${orderItem.itemId} is not active`);
    }

    if (item.direction === "CREDIT" && !allowCreditItems) {
      throw new Error("Not authorized to sell top-up items");
    }

    const itemTotal = item.cost * orderItem.quantity;
    subtotal += itemTotal;
    if (item.direction === "DEBIT") {
      debitSubtotal += itemTotal;
    }

    itemsToAdd.push({
      itemId: item.id,
      name: item.name,
      quantity: orderItem.quantity,
      unitCost: item.cost,
      total: itemTotal,
    });
  }

  // Negative-cost items act as manual discounts; they may reduce the order
  // to exactly 0 (kept for tracking) but never below it.
  if (subtotal < 0) {
    throw new Error("Order total cannot be negative");
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

  // Pre-attached wallet customer (balance-check "use for order"): the order
  // is created already scanned, so payment can go straight to wallet confirm
  let attachedCustomer: {
    id: string;
    name: string | null;
    balance: number;
  } | null = null;
  if (attachedCustomerId) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: attachedCustomerId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!wallet) {
      throw new Error("Attached customer has no wallet");
    }
    // Predefined wallet payment: never create an order the wallet can't
    // cover. Only DEBIT items charge the wallet — CREDIT items are top-ups
    // funded by cash/card and ADD balance, so they don't count.
    if (wallet.balance < debitSubtotal) {
      throw new Error("Order total exceeds the customer's wallet balance");
    }
    attachedCustomer = {
      id: wallet.user.id,
      name: wallet.user.name,
      balance: wallet.balance,
    };
  }

  const order = await prisma.posOrder.create({
    data: {
      shortCode,
      orderHash,
      registerId,
      sellerId,
      subtotal,
      total: subtotal,
      note: note?.trim() || null,
      expiresAt,
      ...(attachedCustomer && {
        customerId: attachedCustomer.id,
        scannedAt: createdAt,
      }),
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

  return { ...order, attachedCustomer };
}
