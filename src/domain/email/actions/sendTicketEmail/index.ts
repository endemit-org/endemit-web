import { TicketEmailData } from "@/domain/ticket/types/ticket";
import { resend, resendFromEmail } from "@/services/resend";
import { NewTicketToCustomerTemplate } from "@/domain/email/templates";

export const sendTicketEmail = async (
  ticket: TicketEmailData,
  ticketQrBuffer: string
) => {
  return await resend.emails.send({
    from: resendFromEmail,
    to: ticket.ticketPayerEmail,
    subject: `Ticket for ${ticket.eventName} (${ticket.ticketHolderName})`,
    react: NewTicketToCustomerTemplate({ ticket }),
    attachments: [
      {
        filename: `ticket-${ticket.id}.png`,
        content: ticketQrBuffer,
      },
    ],
  });
};
