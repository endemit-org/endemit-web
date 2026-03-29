import "server-only";

import { TicketEmailData } from "@/domain/ticket/types/ticket";
import { resend, resendFromEmail } from "@/lib/services/resend";
import { NewTicketToCustomerTemplate } from "@/domain/email/templates";
import { sanitizeForFilename } from "@/lib/util/formatting";

export const sendTicketEmail = async (
  ticket: TicketEmailData,
  ticketQrBuffer: string
) => {
  const sanitizedName = sanitizeForFilename(ticket.ticketHolderName);

  return await resend.emails.send({
    from: resendFromEmail,
    to: ticket.ticketPayerEmail,
    subject: `🎟️ Ticket for ${ticket.eventName} (${ticket.ticketHolderName})`,
    react: NewTicketToCustomerTemplate({ ticket }),
    attachments: [
      {
        filename: `ticket-${ticket.shortId}-${sanitizedName}.png`,
        content: ticketQrBuffer,
      },
    ],
  });
};
