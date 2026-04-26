import "server-only";

import { inngest } from "@/lib/services/inngest";
import assert from "node:assert";

import {
  PosQueueEvent,
  PosTransactionNotificationData,
} from "@/domain/pos/types";
import { prisma } from "@/lib/services/prisma";
import { sendPosTransactionEmail } from "@/domain/email/operations/sendPosTransactionEmail";

export const runPosTransactionEmailAutomation = inngest.createFunction(
  {
    id: "pos-transaction-email-function",
    retries: 5,
    triggers: [{ event: PosQueueEvent.NOTIFY_ON_TRANSACTION }],
  },
  async ({ event, step }) => {
    const { orderId } = event.data as PosTransactionNotificationData;

    // Fetch the order with all required data
    const order = await step.run("fetch-pos-order", async () => {
      const posOrder = await prisma.posOrder.findUnique({
        where: { id: orderId },
        include: {
          register: true,
          customer: {
            select: {
              email: true,
              name: true,
            },
          },
          items: {
            include: {
              item: true,
            },
          },
          transactions: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      return posOrder;
    });

    assert(order !== null, `POS Order not found: ${orderId}`);
    assert(order.customer !== null, `Customer not found for order: ${orderId}`);
    assert(order.customer.email !== null, `Customer email not found for order: ${orderId}`);
    assert(order.paidAt !== null, `Order not paid: ${orderId}`);

    // Only send email for DEBIT transactions (purchases, not top-ups)
    const debitItems = order.items.filter(i => i.item.direction === "DEBIT");
    if (debitItems.length === 0) {
      return { orderId: order.id, skipped: true, reason: "No debit items (top-up only)" };
    }

    const lastTransaction = order.transactions[0];
    assert(lastTransaction, `No transaction found for order: ${orderId}`);

    // Extract values before step.run to avoid serialization issues
    const customerEmail = order.customer.email;
    const paidAt = new Date(order.paidAt);

    await step.run("send-pos-transaction-email", async () => {
      try {
        const result = await sendPosTransactionEmail({
          customerEmail,
          shortCode: order.shortCode,
          registerName: order.register.name,
          items: order.items
            .filter(i => i.item.direction === "DEBIT")
            .map(item => ({
              name: item.name,
              quantity: item.quantity,
              unitCost: item.unitCost,
              total: item.total,
            })),
          subtotal: order.subtotal,
          tipAmount: order.tipAmount,
          total: order.total,
          balanceAfter: lastTransaction.balanceAfter,
          paidAt,
        });

        if (!result || result.error) {
          throw new Error(
            `Failed to send POS transaction email: ${result?.error || "Unknown error"}`
          );
        }

        return result;
      } catch (error) {
        if (error instanceof Error) {
          if (
            error.message.includes("429") ||
            error.message.includes("rate limit")
          ) {
            throw new Error(
              `Rate limit hit when sending POS transaction email for order ${order.id}`
            );
          }
        }

        throw new Error(
          `POS transaction email send failed for order ${order.id}: ${error}`
        );
      }
    });

    return { orderId: order.id, sent: true };
  }
);
