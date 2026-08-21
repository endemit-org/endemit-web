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
import { inngest } from "@/lib/services/inngest";
import { PosError } from "@/domain/pos/types/posError";
import { computeZoi } from "@/lib/services/furs/zoi";
import { isFursConfigured } from "@/lib/services/furs/cert";
import {
  FURS_TAX_NUMBER,
  FURS_PREMISE_ID,
  FURS_DEVICE_ID,
} from "@/lib/services/env/private";
import type { PosOrder, Prisma, WalletTransaction } from "@prisma/client";

export interface MarkPosOrderPaidInput {
  orderHash: string;
  method: "CASH" | "CARD";
  tipAmount: number;
  sellerUserId: string;
  /** Optional buyer email for digital delivery of ticket-linked items. */
  buyerEmail?: string;
}

export interface MarkPosOrderPaidResult {
  success: true;
  order: PosOrder;
}

/**
 * Mark an order as paid with physical tender (cash or an external card
 * terminal). Anonymous for plain sales; top-up orders (CREDIT items) still
 * credit the scanned customer's wallet, funded by the tender.
 * When the register has fiscalization on, a ZDavPR fiscal invoice (with an
 * offline-computed ZOI) is issued inside the same transaction.
 */
export async function markPosOrderPaid(
  input: MarkPosOrderPaidInput
): Promise<MarkPosOrderPaidResult> {
  const { orderHash, method, tipAmount, sellerUserId, buyerEmail } = input;

  if (!Number.isInteger(tipAmount) || tipAmount < 0) {
    throw new PosError("INVALID_TIP", "Invalid tip amount");
  }

  const result = await prisma.$transaction(async tx => {
    const order = await tx.posOrder.findUnique({
      where: { orderHash },
      include: {
        register: true,
        items: { include: { item: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });

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

    const accepts =
      method === "CASH"
        ? order.register.acceptsCash
        : order.register.acceptsCard;
    if (!accepts) {
      throw new PosError(
        "METHOD_NOT_ACCEPTED",
        `This register does not accept ${method.toLowerCase()} payments`
      );
    }

    const creditItems = order.items.filter(i => i.item.direction === "CREDIT");
    const creditTotal = creditItems.reduce((sum, i) => sum + i.total, 0);

    // Top-up orders credit the scanned customer's wallet, funded by the tender
    let walletId: string | null = null;
    let walletTransaction: WalletTransaction | null = null;
    let balanceAfter: number | null = null;
    if (creditTotal > 0) {
      if (!order.customerId) {
        throw new PosError(
          "NOT_SCANNED",
          "Top-up orders require a scanned customer"
        );
      }
      const wallet = await tx.wallet.findUnique({
        where: { userId: order.customerId },
      });
      if (!wallet) {
        throw new PosError("WALLET_NOT_FOUND", "Wallet not found");
      }

      balanceAfter = wallet.balance + creditTotal;
      walletTransaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: method === "CASH" ? "CASH_TOPUP" : "CARD_TOPUP",
          amount: creditTotal,
          balanceAfter,
          note: creditItems.map(i => `${i.quantity}x ${i.name}`).join(", "),
          posOrderId: order.id,
          createdById: sellerUserId,
        },
      });
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });
      walletId = wallet.id;
    }

    // Cash tips join the tip pool ledger; card tips stay on the terminal
    if (tipAmount > 0 && method === "CASH") {
      await tx.posRegister.update({
        where: { id: order.registerId },
        data: { tipPool: { increment: tipAmount } },
      });
    }

    const paidAt = new Date();
    const total = order.subtotal + tipAmount;

    const updatedOrder = await tx.posOrder.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paymentMethod: method,
        tipAmount,
        total,
        paidAt,
        ...(walletId && { walletId }),
      },
    });

    // Fiscal invoice (ZDavPR) — ZOI computed offline, EOR fetched by the
    // submission queue
    let fiscalInvoiceId: string | null = null;
    if (order.register.fiscalizeInvoices) {
      fiscalInvoiceId = await issueFiscalInvoice(tx, {
        posOrderId: order.id,
        amountCents: total,
        issuedAt: paidAt,
      });
    }

    return {
      order: updatedOrder,
      registerName: order.register.name,
      customer: order.customer,
      walletId,
      walletTransaction,
      balanceAfter,
      paidAt,
      fiscalInvoiceId,
      hasTicketItems: order.items.some(i => i.item.ticketEventId),
    };
  });

  after(async () => {
    const payload = {
      orderId: result.order.id,
      shortCode: result.order.shortCode,
      total: result.order.total,
      tipAmount: result.order.tipAmount,
      paymentMethod: method,
      paidAt: result.paidAt.toISOString(),
      ...(result.balanceAfter !== null && {
        balanceAfter: result.balanceAfter,
      }),
    };

    const broadcasts: Promise<unknown>[] = [
      broadcastToChannel(
        `pos:register:${result.order.registerId}`,
        "pos_order_paid",
        payload
      ),
      broadcastToChannel(
        `pos:order:${result.order.id}`,
        "pos_order_paid",
        payload
      ),
    ];

    // Wallet side effects only when a wallet was actually credited (top-up)
    if (result.walletTransaction && result.customer) {
      broadcasts.push(
        broadcastToUser(result.customer.id, "wallet_transaction_created", {
          transactionId: result.walletTransaction.id,
          walletId: result.walletTransaction.walletId,
          type: result.walletTransaction.type,
          amount: result.walletTransaction.amount,
          balanceAfter: result.walletTransaction.balanceAfter,
          note: result.walletTransaction.note,
          createdAt: result.walletTransaction.createdAt.toISOString(),
        }),
        notifyOnPosTransaction({
          type: "CREDIT",
          amount: result.walletTransaction.amount,
          balanceAfter: result.walletTransaction.balanceAfter,
          note: result.walletTransaction.note,
          userName: result.customer.name,
          userEmail: result.customer.email,
          registerName: result.registerName,
        }).catch(() => {}),
        queuePosTransactionEmail({ orderId: result.order.id }).catch(() => {})
      );
    }

    if (result.fiscalInvoiceId) {
      broadcasts.push(
        inngest
          .send({
            name: "pos/fiscal.invoice.created",
            data: { fiscalInvoiceId: result.fiscalInvoiceId },
          })
          .catch(() => {})
      );
    }

    // Ticket-linked items → durable ticket issuance (anonymous door tickets,
    // optionally emailed to the captured buyer address)
    if (result.hasTicketItems) {
      broadcasts.push(
        inngest
          .send({
            name: "pos/tickets.issue",
            data: { posOrderId: result.order.id, buyerEmail },
          })
          .catch(() => {})
      );
    }

    broadcasts.push(bustOnPosOrderPaid(result.customer?.id ?? null));

    await Promise.all(broadcasts);
  });

  return { success: true, order: result.order };
}

/**
 * Issue a fiscal invoice inside the payment transaction: sequential number
 * from the single-row counter (row lock serializes concurrent payments),
 * offline ZOI, PENDING submission status.
 */
export async function issueFiscalInvoice(
  tx: Prisma.TransactionClient,
  input: {
    posOrderId: string;
    amountCents: number;
    issuedAt: Date;
    isStorno?: boolean;
    referenceInvoiceId?: string;
  }
): Promise<string> {
  if (
    !isFursConfigured() ||
    !FURS_TAX_NUMBER ||
    !FURS_PREMISE_ID ||
    !FURS_DEVICE_ID
  ) {
    throw new PosError(
      "FISCAL_NOT_CONFIGURED",
      "Fiscalization is enabled for this register but FURS is not configured"
    );
  }

  const counter = await tx.fiscalCounter.update({
    where: { id: 1 },
    data: { lastNumber: { increment: 1 } },
  });
  const invoiceNumber = counter.lastNumber;

  const zoi = computeZoi({
    taxNumber: FURS_TAX_NUMBER,
    issuedAt: input.issuedAt,
    invoiceNumber,
    businessPremiseId: FURS_PREMISE_ID,
    electronicDeviceId: FURS_DEVICE_ID,
    amountCents: input.amountCents,
  });

  const invoice = await tx.fiscalInvoice.create({
    data: {
      posOrderId: input.posOrderId,
      invoiceNumber,
      businessPremiseId: FURS_PREMISE_ID,
      electronicDeviceId: FURS_DEVICE_ID,
      issuedAt: input.issuedAt,
      amount: input.amountCents,
      zoi,
      isStorno: input.isStorno ?? false,
      ...(input.referenceInvoiceId && {
        referenceInvoiceId: input.referenceInvoiceId,
      }),
    },
  });

  return invoice.id;
}
