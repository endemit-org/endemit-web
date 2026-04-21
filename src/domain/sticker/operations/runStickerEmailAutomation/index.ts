import "server-only";

import assert from "node:assert";
import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import {
  StickerQueueEvent,
  type StickerLinkedNotificationData,
  type StickerUnlinkedNotificationData,
  type StickerReplacedNotificationData,
} from "@/domain/sticker/types";
import { sendStickerLinkedEmail } from "@/domain/email/operations/sendStickerLinkedEmail";
import { sendStickerUnlinkedEmail } from "@/domain/email/operations/sendStickerUnlinkedEmail";
import { sendStickerReplacedEmail } from "@/domain/email/operations/sendStickerReplacedEmail";

async function fetchCustomerEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}

export const runStickerLinkedEmailAutomation = inngest.createFunction(
  { id: "sticker-linked-email-function", retries: 5 },
  { event: StickerQueueEvent.NOTIFY_LINKED },
  async ({ event, step }) => {
    const { userId, code } = event.data as StickerLinkedNotificationData;

    const customerEmail = await step.run("fetch-user-email", () =>
      fetchCustomerEmail(userId)
    );

    if (!customerEmail) {
      return { userId, skipped: true, reason: "No email on file" };
    }

    await step.run("send-sticker-linked-email", async () => {
      const result = await sendStickerLinkedEmail({ customerEmail, code });
      if (result && result.error) {
        throw new Error(
          `Failed to send sticker-linked email: ${result.error}`
        );
      }
      return result;
    });

    return { userId, sent: true };
  }
);

export const runStickerUnlinkedEmailAutomation = inngest.createFunction(
  { id: "sticker-unlinked-email-function", retries: 5 },
  { event: StickerQueueEvent.NOTIFY_UNLINKED },
  async ({ event, step }) => {
    const { userId, code } = event.data as StickerUnlinkedNotificationData;

    const customerEmail = await step.run("fetch-user-email", () =>
      fetchCustomerEmail(userId)
    );

    if (!customerEmail) {
      return { userId, skipped: true, reason: "No email on file" };
    }

    await step.run("send-sticker-unlinked-email", async () => {
      const result = await sendStickerUnlinkedEmail({ customerEmail, code });
      if (result && result.error) {
        throw new Error(
          `Failed to send sticker-unlinked email: ${result.error}`
        );
      }
      return result;
    });

    return { userId, sent: true };
  }
);

export const runStickerReplacedEmailAutomation = inngest.createFunction(
  { id: "sticker-replaced-email-function", retries: 5 },
  { event: StickerQueueEvent.NOTIFY_REPLACED },
  async ({ event, step }) => {
    const { userId, oldCode, newCode } =
      event.data as StickerReplacedNotificationData;

    assert(oldCode, "oldCode required for replaced event");
    assert(newCode, "newCode required for replaced event");

    const customerEmail = await step.run("fetch-user-email", () =>
      fetchCustomerEmail(userId)
    );

    if (!customerEmail) {
      return { userId, skipped: true, reason: "No email on file" };
    }

    await step.run("send-sticker-replaced-email", async () => {
      const result = await sendStickerReplacedEmail({
        customerEmail,
        oldCode,
        newCode,
      });
      if (result && result.error) {
        throw new Error(
          `Failed to send sticker-replaced email: ${result.error}`
        );
      }
      return result;
    });

    return { userId, sent: true };
  }
);
