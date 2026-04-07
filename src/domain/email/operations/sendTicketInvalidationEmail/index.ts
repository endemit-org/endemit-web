import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  TicketInvalidationTemplate,
  type InvalidatedTicket,
} from "@/domain/email/templates/TicketInvalidation";

interface SendTicketInvalidationEmailInput {
  email: string;
  tickets: InvalidatedTicket[];
  orderId: string;
}

export const sendTicketInvalidationEmail = async (
  input: SendTicketInvalidationEmailInput
) => {
  if (isBlockedEmail(input.email)) {
    console.log(`Skipping ticket invalidation email to blocked address: ${input.email}`);
    return null;
  }

  const ticketCount = input.tickets.length;
  const subject =
    ticketCount === 1
      ? `Your ticket has been invalidated`
      : `Your tickets have been invalidated`;

  return await resend.emails.send({
    from: resendFromEmail,
    to: input.email,
    subject,
    react: TicketInvalidationTemplate({
      tickets: input.tickets,
      orderId: input.orderId,
    }),
  });
};
