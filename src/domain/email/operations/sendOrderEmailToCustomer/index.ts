import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import { Order } from "@prisma/client";
import { NewOrderToCustomerTemplate } from "@/domain/email/templates";

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

  return await resend.emails.send({
    from: resendFromEmail,
    to: order.email,
    subject: `Your order @ endemit`,
    react: NewOrderToCustomerTemplate({ order }),
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
