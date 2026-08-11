import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { broadcastToUser } from "@/lib/services/supabase/broadcast";
import { bustOnPosOrderReversed } from "@/lib/services/cache";

/**
 * Admin reversal of a PAID POS order: creates compensating REFUND wallet
 * transactions (one per original, linked via relatedTransactionId), restores
 * the wallet balance, returns the tip from the register's tipPool and marks
 * the order CANCELLED. The order and full transaction history stay in the DB —
 * use deletePosOrder to also remove the traces (demo cleanup).
 */
export async function reversePosOrder(orderId: string, adminUserId: string) {
  const result = await prisma.$transaction(async tx => {
    const order = await tx.posOrder.findUnique({
      where: { id: orderId },
      include: { transactions: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }
    if (order.status !== "PAID") {
      throw new Error(`Cannot reverse order with status ${order.status}`);
    }
    if (!order.walletId) {
      throw new Error("Order has no wallet attached");
    }
    if (order.transactions.some(t => t.type === "REFUND")) {
      throw new Error("Order was already reversed");
    }

    const wallet = await tx.wallet.findUnique({
      where: { id: order.walletId },
    });
    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const originals = order.transactions;
    let balance = wallet.balance;
    const refunds = [];

    for (const orig of originals) {
      balance -= orig.amount;
      refunds.push(
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "REFUND",
            amount: -orig.amount,
            balanceAfter: balance,
            note: `Reversal of order ${order.shortCode}${orig.note ? `: ${orig.note}` : ""}`,
            createdById: adminUserId,
            posOrderId: order.id,
            relatedTransactionId: orig.id,
          },
        })
      );
    }

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance },
    });

    if (order.tipAmount > 0) {
      await tx.posRegister.update({
        where: { id: order.registerId },
        data: { tipPool: { decrement: order.tipAmount } },
      });
    }

    const updatedOrder = await tx.posOrder.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: "reversed by admin",
      },
    });

    return {
      order: updatedOrder,
      walletId: wallet.id,
      customerId: order.customerId,
      refunds,
    };
  });

  // Broadcasts + cache busting after the response is sent.
  after(async () => {
    const walletBroadcasts = result.customerId
      ? result.refunds.map(refund =>
          broadcastToUser(result.customerId!, "wallet_transaction_created", {
            transactionId: refund.id,
            walletId: result.walletId,
            type: refund.type,
            amount: refund.amount,
            balanceAfter: refund.balanceAfter,
            note: refund.note,
            createdAt: refund.createdAt.toISOString(),
          })
        )
      : [];

    await Promise.all([
      ...walletBroadcasts,
      bustOnPosOrderReversed(result.customerId, result.walletId),
    ]);
  });

  return result.order;
}
