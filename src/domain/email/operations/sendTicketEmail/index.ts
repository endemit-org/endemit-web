import "server-only";

import { TicketEmailData } from "@/domain/ticket/types/ticket";
import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import { NewTicketToCustomerTemplate } from "@/domain/email/templates";
import { sanitizeForFilename } from "@/lib/util/formatting";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

export const sendTicketEmail = async (
  ticket: TicketEmailData,
  ticketQrBuffer: string,
  locale = "sl"
) => {
  if (isBlockedEmail(ticket.ticketPayerEmail)) {
    console.log(`Skipping email to blocked address: ${ticket.ticketPayerEmail}`);
    return null;
  }

  const sanitizedName = sanitizeForFilename(ticket.ticketHolderName);
  const t = getEmailTranslator(locale, "emails.newTicket");

  return await resend.emails.send({
    from: resendFromEmail,
    to: ticket.ticketPayerEmail,
    subject: t("subject", {
      eventName: ticket.eventName,
      name: ticket.ticketHolderName,
    }),
    react: NewTicketToCustomerTemplate({ ticket, locale }),
    attachments: [
      {
        filename: `ticket-${ticket.shortId}-${sanitizedName}.png`,
        content: ticketQrBuffer,
      },
    ],
  });
};
