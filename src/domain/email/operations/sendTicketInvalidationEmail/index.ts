import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  TicketInvalidationTemplate,
  type InvalidatedTicket,
} from "@/domain/email/templates/TicketInvalidation";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface SendTicketInvalidationEmailInput {
  email: string;
  tickets: InvalidatedTicket[];
  orderId: string;
  locale?: string;
}

export const sendTicketInvalidationEmail = async (
  input: SendTicketInvalidationEmailInput
) => {
  if (isBlockedEmail(input.email)) {
    console.log(`Skipping ticket invalidation email to blocked address: ${input.email}`);
    return null;
  }

  const ticketCount = input.tickets.length;
  const t = getEmailTranslator(input.locale ?? "sl", "emails.ticketInvalidation");
  const subject = ticketCount === 1 ? t("subjectOne") : t("subjectMany");

  return await resend.emails.send({
    from: resendFromEmail,
    to: input.email,
    subject,
    react: TicketInvalidationTemplate({
      tickets: input.tickets,
      orderId: input.orderId,
      locale: input.locale,
    }),
  });
};
