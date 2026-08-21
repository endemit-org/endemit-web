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
import { PosError } from "@/domain/pos/types/posError";
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
      throw new PosError("ORDER_NOT_FOUND", "Order not found");
    }

    if (order.status !== "PENDING") {
      throw new PosError(
        "ORDER_NOT_PENDING",
        `Order is ${order.status.toLowerCase()}`
      );
    }

    if (new Date() > order.expiresAt) {
      throw new PosError("ORDER_EXPIRED", "Order has expired");
    }

    if (order.customerId && order.customerId !== customerId) {
      throw new PosError(
        "ORDER_OTHER_CUSTOMER",
        "Order belongs to another customer"
      );
    }

    if (!wallet) {
      throw new PosError("WALLET_NOT_FOUND", "Wallet not found");
    }

    if (!order.register.acceptsWallet) {
      throw new PosError(
        "METHOD_NOT_ACCEPTED",
        "This register does not accept wallet payments"
      );
    }

    // Top-up orders must be funded with physical tender (cash/card) — a
    // wallet cannot fund its own top-up.
    const hasCreditItems = order.items.some(
      i => i.item.direction === "CREDIT"
    );
    if (hasCreditItems) {
      throw new PosError(
        "TOPUP_NOT_WALLET_PAYABLE",
        "Top-up orders cannot be paid from the wallet"
      );
    }

    const debitItems = order.items.filter(i => i.item.direction === "DEBIT");
    const debitTotal = debitItems.reduce((sum, i) => sum + i.total, 0) + tipAmount;

    const formatItemsDescription = (items: typeof order.items) =>
      items.map(i => `${i.quantity}x ${i.name}`).join(", ");

    let currentBalance = wallet.balance;
    let lastTransaction: WalletTransaction | null = null;

    // Process DEBIT items (if any)
    if (debitTotal > 0) {
      // Check if balance is sufficient for debit
      if (currentBalance < debitTotal) {
        throw new PosError("INSUFFICIENT_BALANCE", "Insufficient balance");
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

    // A wallet payment with nothing to debit is a broken order (zero-priced
    // items and no tip) — fail loudly here instead of crashing downstream
    // where the transaction record is assumed to exist.
    if (!lastTransaction) {
      throw new PosError("ORDER_NOT_FOUND", "Order has no payable amount");
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

    // Update order
    const paidAt = new Date();
    const updatedOrder = await tx.posOrder.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentMethod: "WALLET",
        customerId,
        walletId: wallet.id,
        tipAmount,
        total: debitTotal,
        paidAt,
      },
    });

    return {
      order: updatedOrder,
      transaction: lastTransaction,
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
        paymentMethod: "WALLET",
        paidAt: result.paidAt.toISOString(),
        balanceAfter: result.transaction.balanceAfter,
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
        paymentMethod: "WALLET",
        paidAt: result.paidAt.toISOString(),
        balanceAfter: result.transaction.balanceAfter,
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
