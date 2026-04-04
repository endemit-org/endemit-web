import "server-only";

import { inngest } from "@/lib/services/inngest";
import { EmailQueueEvent, EventReminderData } from "@/domain/email/types/email";

/**
 * Queues an event reminder email with idempotency.
 * Uses eventId + email + date as the idempotency key to prevent duplicate emails.
 */
export async function queueEventReminderEmail(
  data: EventReminderData,
  reminderDate: string // YYYY-MM-DD format for idempotency
) {
  // Create idempotent event ID to prevent duplicate sends
  // Format: reminder-{eventId}-{email}-{date}
  const idempotencyKey = `reminder-${data.eventId}-${data.recipientEmail}-${reminderDate}`;

  await inngest.send({
    id: idempotencyKey,
    name: EmailQueueEvent.SEND_EVENT_REMINDER,
    data,
  });
}
