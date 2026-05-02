import "server-only";

import assert from "node:assert";
import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import {
  WalletQueueEvent,
  type P2PTransferNotificationData,
} from "@/domain/wallet/types";
import { sendWalletTransferEmail } from "@/domain/email/operations/sendWalletTransferEmail";

export const runP2PTransferEmailAutomation = inngest.createFunction(
  {
    id: "wallet-p2p-transfer-email-function",
    retries: 5,
    triggers: [{ event: WalletQueueEvent.NOTIFY_P2P_TRANSFER }],
  },
  async ({ event, step }) => {
    const { debitTransactionId, creditTransactionId } =
      event.data as P2PTransferNotificationData;

    const data = await step.run("fetch-transfer-context", async () => {
      const [debit, credit] = await Promise.all([
        prisma.walletTransaction.findUnique({
          where: { id: debitTransactionId },
          include: {
            wallet: {
              select: {
                user: {
                  select: { id: true, name: true, username: true, email: true },
                },
              },
            },
          },
        }),
        prisma.walletTransaction.findUnique({
          where: { id: creditTransactionId },
          include: {
            wallet: {
              select: {
                user: {
                  select: { id: true, name: true, username: true, email: true },
                },
              },
            },
          },
        }),
      ]);

      return { debit, credit };
    });

    assert(data.debit, `Debit transaction not found: ${debitTransactionId}`);
    assert(data.credit, `Credit transaction not found: ${creditTransactionId}`);

    const sender = data.debit.wallet.user;
    const recipient = data.credit.wallet.user;
    const amount = Math.abs(data.debit.amount);
    const note = data.debit.note;
    const occurredAt = new Date(data.debit.createdAt);

    const senderLabel = sender.name || sender.username;
    const recipientLabel = recipient.name || recipient.username;

    if (sender.email) {
      await step.run("send-sender-email", async () => {
        const result = await sendWalletTransferEmail({
          customerEmail: sender.email!,
          direction: "sent",
          amount,
          balanceAfter: data.debit!.balanceAfter,
          counterpartyName: recipientLabel,
          note,
          occurredAt,
          transactionId: data.debit!.id,
        });
        if (result && result.error) {
          throw new Error(
            `Failed to send sender transfer email: ${result.error}`
          );
        }
        return result;
      });
    }

    if (recipient.email) {
      await step.run("send-recipient-email", async () => {
        const result = await sendWalletTransferEmail({
          customerEmail: recipient.email!,
          direction: "received",
          amount,
          balanceAfter: data.credit!.balanceAfter,
          counterpartyName: senderLabel,
          note,
          occurredAt,
          transactionId: data.credit!.id,
        });
        if (result && result.error) {
          throw new Error(
            `Failed to send recipient transfer email: ${result.error}`
          );
        }
        return result;
      });
    }

    return { sent: true };
  }
);
