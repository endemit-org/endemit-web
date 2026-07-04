import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import { Order } from "@prisma/client";
import { NewOrderToCustomerTemplate } from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

export const sendOrderEmailToCustomer = async (
  order: Order,
  invoiceAttachment?: {
    buffer: string;
    filename: string;
  }
) => {
  if (isBlockedEmail(order.email)) {
    console.log(`Skipping email to blocked address: ${order.email}`);
    return null;
  }

  const t = getEmailTranslator(order.locale, "emails.orderCustomer");

  return await resend.emails.send({
    from: resendFromEmail,
    to: order.email,
    subject: t("subject"),
    react: NewOrderToCustomerTemplate({ order, locale: order.locale }),
    attachments: invoiceAttachment
      ? [
          {
            filename: invoiceAttachment.filename,
            content: invoiceAttachment.buffer,
          },
        ]
      : undefined,
  });
};
