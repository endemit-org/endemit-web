import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import {
  broadcastToChannel,
  broadcastToUser,
} from "@/lib/services/supabase/broadcast";
import { notifyOnPosTransaction } from "@/domain/notification/operations/notifyOnPosTransaction";
import { queuePosTransactionEmail } from "@/domain/pos/operations/queuePosTransactionEmail";
import { bustOnPosOrderPaid } from "@/lib/services/cache";
import type { PayPosOrderInput, PayPosOrderResult } from "@/domain/pos/types";
import type { WalletTransaction } from "@prisma/client";

export async function payPosOrder(
  input: PayPosOrderInput
): Promise<PayPosOrderResult> {
  const { orderHash, customerId, tipAmount } = input;

  // Use transaction for atomicity
  const result = await prisma.$transaction(async tx => {
    // Independent reads — issued together so Prisma can pipeline them
    const [order, wallet] = await Promise.all([
      tx.posOrder.findUnique({
        where: { orderHash },
        include: {
          register: true,
          items: {
            include: {
              item: true,
            },
          },
        },
      }),
      tx.wallet.findUnique({
        where: { userId: customerId },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.status !== "PENDING") {
      throw new Error(`Order is ${order.status.toLowerCase()}`);
    }

    if (new Date() > order.expiresAt) {
      throw new Error("Order has expired");
    }

    if (order.customerId && order.customerId !== customerId) {
      throw new Error("Order belongs to another customer");
    }

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    // Separate items by direction and build descriptions
    const creditItems = order.items.filter(i => i.item.direction === "CREDIT");
    const debitItems = order.items.filter(i => i.item.direction === "DEBIT");

    const creditTotal = creditItems.reduce((sum, i) => sum + i.total, 0);
    const debitTotal = debitItems.reduce((sum, i) => sum + i.total, 0) + tipAmount;

    const formatItemsDescription = (items: typeof order.items) =>
      items.map(i => `${i.quantity}x ${i.name}`).join(", ");

    let currentBalance = wallet.balance;
    let lastTransaction: WalletTransaction | null = null;

    // Process CREDIT items first (if any)
    if (creditTotal > 0) {
      currentBalance += creditTotal;
      lastTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount: creditTotal,
          balanceAfter: currentBalance,
          note: formatItemsDescription(creditItems),
          posOrderId: order.id,
        },
      });
    }

    // Process DEBIT items (if any)
    if (debitTotal > 0) {
      // Check if balance is sufficient for debit
      if (currentBalance < debitTotal) {
        throw new Error("Insufficient balance");
      }

      currentBalance -= debitTotal;
      const debitNote = tipAmount > 0
        ? `${formatItemsDescription(debitItems)}${debitItems.length > 0 ? ", " : ""}Tip`
        : formatItemsDescription(debitItems);

      lastTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: -debitTotal,
          balanceAfter: currentBalance,
          note: debitNote || "POS Purchase",
          posOrderId: order.id,
        },
      });
    }

    // Update wallet balance
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: currentBalance },
    });

    // Add tip to register pool (if any)
    if (tipAmount > 0) {
      await tx.posRegister.update({
        where: { id: order.registerId },
        data: {
          tipPool: {
            increment: tipAmount,
          },
        },
      });
    }

    // Calculate total for the order record
    const total = debitTotal - creditTotal;

    // Update order
    const paidAt = new Date();
    const updatedOrder = await tx.posOrder.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        customerId,
        walletId: wallet.id,
        tipAmount,
        total,
        paidAt,
      },
    });

    return {
      order: updatedOrder,
      transaction: lastTransaction!,
      wallet: { ...wallet, balance: currentBalance },
      paidAt,
      debitTotal,
      userName: wallet.user.name,
      userEmail: wallet.user.email,
      registerName: order.register.name,
    };
  });

  // Run announcements + side-effects after the response is sent.
  // Broadcasts still fire (seller/customer realtime UIs still update); the
  // seller's HTTP response no longer waits on Supabase/Discord/Inngest.
  after(async () => {
    const sellerBroadcast = broadcastToChannel(
      `pos:register:${result.order.registerId}`,
      "pos_order_paid",
      {
        orderId: result.order.id,
        shortCode: result.order.shortCode,
        total: result.order.total,
        tipAmount: result.order.tipAmount,
        paidAt: result.paidAt.toISOString(),
      }
    );

    const customerBroadcast = broadcastToChannel(
      `pos:order:${result.order.id}`,
      "pos_order_paid",
      {
        orderId: result.order.id,
        shortCode: result.order.shortCode,
        total: result.order.total,
        tipAmount: result.order.tipAmount,
        paidAt: result.paidAt.toISOString(),
      }
    );

    const walletBroadcast = broadcastToUser(
      customerId,
      "wallet_transaction_created",
      {
        transactionId: result.transaction.id,
        walletId: result.wallet.id,
        type: result.transaction.type,
        amount: result.transaction.amount,
        balanceAfter: result.transaction.balanceAfter,
        note: result.transaction.note,
        createdAt: result.transaction.createdAt.toISOString(),
      }
    );

    const discord =
      result.debitTotal > 0
        ? notifyOnPosTransaction({
            type: "DEBIT",
            amount: result.debitTotal,
            balanceAfter: result.transaction.balanceAfter,
            note: result.transaction.note,
            userName: result.userName,
            userEmail: result.userEmail,
            registerName: result.registerName,
          }).catch(() => {})
        : Promise.resolve();

    const email = queuePosTransactionEmail({
      orderId: result.order.id,
    }).catch(() => {});

    await Promise.all([
      sellerBroadcast,
      customerBroadcast,
      walletBroadcast,
      discord,
      email,
      bustOnPosOrderPaid(customerId),
    ]);
  });

  return {
    success: true,
    order: result.order,
    transaction: {
      id: result.transaction.id,
      amount: result.transaction.amount,
      balanceAfter: result.transaction.balanceAfter,
    },
  };
}
