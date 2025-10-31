import "server-only";

import { resend, resendFromEmail } from "@/lib/services/resend";
import { Order } from "@prisma/client";
import { NewOrderToCustomerTemplate } from "@/domain/email/templates";

export const sendOrderEmailToCustomer = async (
  order: Order,
  invoiceAttachment: {
    buffer: string;
    filename: string;
  }
) => {
  return await resend.emails.send({
    from: resendFromEmail,
    to: order.email,
    subject: `Your order @ endemit`,
    react: NewOrderToCustomerTemplate({ order }),
    attachments: [
      {
        filename: invoiceAttachment.filename,
        content: invoiceAttachment.buffer,
      },
    ],
  });
};
