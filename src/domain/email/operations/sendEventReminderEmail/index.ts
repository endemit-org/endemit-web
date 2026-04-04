import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  EventReminderTemplate,
  type EventReminderProps,
} from "@/domain/email/templates";

interface TicketAttachment {
  filename: string;
  content: string; // base64 encoded
}

interface SendEventReminderEmailParams extends EventReminderProps {
  recipientEmail: string;
  attachments?: TicketAttachment[];
}

export const sendEventReminderEmail = async ({
  recipientEmail,
  eventName,
  eventDate,
  eventPromoImageUrl,
  venue,
  artists,
  tickets,
  attachments,
}: SendEventReminderEmailParams) => {
  if (isBlockedEmail(recipientEmail)) {
    console.log(
      `Skipping reminder email to blocked address: ${recipientEmail}`
    );
    return null;
  }

  const ticketCount = tickets.length;
  const subject =
    ticketCount > 1
      ? `Tomorrow: ${eventName} - Your ${ticketCount} tickets are ready!`
      : `Tomorrow: ${eventName} - Your ticket is ready!`;

  return await resend.emails.send({
    from: resendFromEmail,
    to: recipientEmail,
    subject,
    react: EventReminderTemplate({
      eventName,
      eventDate,
      eventPromoImageUrl,
      venue,
      artists,
      tickets,
    }),
    attachments,
  });
};
