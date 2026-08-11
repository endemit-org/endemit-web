import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { bustOnPosOrderDeleted } from "@/lib/services/cache";

/**
 * Admin hard-delete of a POS order (demo cleanup — keeps sales statistics
 * clean). If the order is PAID and was not reversed first, the wallet balance
 * and register tipPool are restored as part of the delete. The order, its
 * items and its wallet transactions are then physically removed.
 */
export async function deletePosOrder(orderId: string) {
  const result = await prisma.$transaction(async tx => {
    const order = await tx.posOrder.findUnique({
      where: { id: orderId },
      include: { transactions: true },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    // Net wallet effect of everything this order did (originals + any
    // refunds). For a reversed order this is 0; for an unreversed PAID order
    // decrementing by the (negative) net restores the customer's balance.
    const net = order.transactions.reduce((sum, t) => sum + t.amount, 0);
    if (order.walletId && net !== 0) {
      await tx.wallet.update({
        where: { id: order.walletId },
        data: { balance: { decrement: net } },
      });
    }

    const tipStillInPool =
      order.status === "PAID" &&
      order.tipAmount > 0 &&
      !order.transactions.some(t => t.type === "REFUND");
    if (tipStillInPool) {
      await tx.posRegister.update({
        where: { id: order.registerId },
        data: { tipPool: { decrement: order.tipAmount } },
      });
    }

    await tx.walletTransaction.deleteMany({
      where: { posOrderId: order.id },
    });
    // PosOrderItem rows cascade with the order.
    await tx.posOrder.delete({ where: { id: order.id } });

    return { customerId: order.customerId, walletId: order.walletId };
  });

  after(async () => {
    await bustOnPosOrderDeleted(result.customerId, result.walletId);
  });

  return { deleted: true };
}
