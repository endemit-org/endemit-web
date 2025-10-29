import "server-only";

import {
  merchantToEmail,
  resend,
  resendFromEmail,
} from "@/lib/services/resend";
import { Order } from "@prisma/client";
import { NewOrderToMerchantTemplate } from "@/domain/email/templates/NewOrderToMerchant";

export const sendOrderEmailToMerchant = async (
  order: Order,
  invoiceAttachment: {
    buffer: string;
    filename: string;
  }
) => {
  return await resend.emails.send({
    from: resendFromEmail,
    to: merchantToEmail,
    subject: `New order on endemit`,
    react: NewOrderToMerchantTemplate({ order }),
    attachments: [
      {
        filename: invoiceAttachment.filename,
        content: invoiceAttachment.buffer,
      },
    ],
  });
};
