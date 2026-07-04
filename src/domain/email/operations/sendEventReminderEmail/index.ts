import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  EventReminderTemplate,
  type EventReminderProps,
} from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

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
  locale = "sl",
}: SendEventReminderEmailParams) => {
  if (isBlockedEmail(recipientEmail)) {
    console.log(
      `Skipping reminder email to blocked address: ${recipientEmail}`
    );
    return null;
  }

  const ticketCount = tickets.length;
  const t = getEmailTranslator(locale, "emails.eventReminder");
  const subject = t("subject", { eventName, count: ticketCount });

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
      locale,
    }),
    attachments,
  });
};
