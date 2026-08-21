import "server-only";

import { after } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { broadcastToUser } from "@/lib/services/supabase/broadcast";
import { bustOnPosOrderReversed, bustOnTicketIssued } from "@/lib/services/cache";
import { inngest } from "@/lib/services/inngest";

/**
 * Admin reversal of a PAID POS order. Wallet-linked orders (wallet payments
 * and cash/card-funded top-ups) get compensating REFUND wallet transactions
 * restoring the balance; anonymous cash/card sales just flip to CANCELLED
 * (the physical refund happens outside the system). Tips return to the
 * tipPool only for methods that fed it (WALLET/CASH). Fiscalized orders get
 * a queued storno invoice.
 */
export async function reversePosOrder(orderId: string, adminUserId: string) {
  const result = await prisma.$transaction(async tx => {
    const order = await tx.posOrder.findUnique({
      where: { id: orderId },
      include: {
        transactions: true,
        fiscalInvoices: { where: { isStorno: false } },
        tickets: {
          select: { id: true, status: true, scanCount: true, eventId: true },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }
    if (order.status !== "PAID") {
      throw new Error(`Cannot reverse order with status ${order.status}`);
    }
    if (order.transactions.some(t => t.type === "REFUND")) {
      throw new Error("Order was already reversed");
    }

    // Tickets sold on this order: cancel them with the reversal, but a
    // ticket already scanned at the door needs manual judgment — block.
    const activeTickets = order.tickets.filter(
      t => t.status !== "CANCELLED" && t.status !== "REFUNDED"
    );
    if (activeTickets.some(t => t.scanCount > 0 || t.status === "SCANNED")) {
      throw new Error(
        "Order has tickets that were already scanned — handle the refund manually"
      );
    }
    if (activeTickets.length > 0) {
      await tx.ticket.updateMany({
        where: { id: { in: activeTickets.map(t => t.id) } },
        data: { status: "CANCELLED" },
      });
    }

    let walletId: string | null = null;
    const refunds = [];

    if (order.walletId) {
      const wallet = await tx.wallet.findUnique({
        where: { id: order.walletId },
      });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      let balance = wallet.balance;
      for (const orig of order.transactions) {
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
      walletId = wallet.id;
    }

    // Only WALLET and CASH tips ever entered the pool (CARD tips stay on the
    // terminal)
    if (
      order.tipAmount > 0 &&
      (order.paymentMethod === "WALLET" || order.paymentMethod === "CASH")
    ) {
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
        cancelReason:
          order.paymentMethod === "CASH" || order.paymentMethod === "CARD"
            ? "reversed by admin (refund tendered manually)"
            : "reversed by admin",
      },
    });

    // Storno invoice for fiscalized orders — negative amount referencing the
    // original, queued for FURS submission
    let stornoInvoiceId: string | null = null;
    const originalInvoice = order.fiscalInvoices[0];
    if (originalInvoice) {
      const { issueFiscalInvoice } = await import(
        "@/domain/pos/operations/markPosOrderPaid"
      );
      stornoInvoiceId = await issueFiscalInvoice(tx, {
        posOrderId: order.id,
        amountCents: -originalInvoice.amount,
        issuedAt: new Date(),
        isStorno: true,
        referenceInvoiceId: originalInvoice.id,
      });
    }

    return {
      order: updatedOrder,
      walletId,
      customerId: order.customerId,
      refunds,
      stornoInvoiceId,
      cancelledTickets: activeTickets.map(t => ({
        id: t.id,
        eventId: t.eventId,
      })),
    };
  });

  // Broadcasts + cache busting after the response is sent.
  after(async () => {
    // Consts narrow properly inside the closure — no non-null assertions
    const { customerId, walletId } = result;
    const walletBroadcasts =
      customerId && walletId
        ? result.refunds.map(refund =>
            broadcastToUser(customerId, "wallet_transaction_created", {
              transactionId: refund.id,
              walletId,
              type: refund.type,
              amount: refund.amount,
              balanceAfter: refund.balanceAfter,
              note: refund.note,
              createdAt: refund.createdAt.toISOString(),
            })
          )
        : [];

    const stornoSubmission = result.stornoInvoiceId
      ? inngest
          .send({
            name: "pos/fiscal.invoice.created",
            data: { fiscalInvoiceId: result.stornoInvoiceId },
          })
          .catch(() => {})
      : Promise.resolve();

    // Cancelled tickets change event stats — bust their ticket caches
    const ticketBusts = result.cancelledTickets.map(ticket =>
      bustOnTicketIssued(ticket.id, result.customerId, ticket.eventId).catch(
        () => {}
      )
    );

    await Promise.all([
      ...walletBroadcasts,
      ...ticketBusts,
      stornoSubmission,
      bustOnPosOrderReversed(result.customerId, result.walletId),
    ]);
  });

  return result.order;
}
