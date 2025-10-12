import { TicketEmailData } from "@/types/ticket";
import { resend, resendFromEmail } from "@/services/resend/resend";
import { NewTicketToCustomerTemplate } from "@/domain/email/templates";

export const sendTicketEmail = async (
  ticket: TicketEmailData,
  ticketQrBuffer: string
) => {
  return await resend.emails.send({
    from: resendFromEmail,
    to: ticket.ticketPayerEmail,
    subject: `Your ticket for ${ticket.eventName}`,
    react: NewTicketToCustomerTemplate({ ticket }),
    attachments: [
      {
        filename: `ticket-${ticket.id}.png`,
        content: ticketQrBuffer,
      },
    ],
  });
};
