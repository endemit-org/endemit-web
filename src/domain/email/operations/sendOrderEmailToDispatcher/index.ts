import "server-only";

import {
  dispatcherToEmail,
  resend,
  resendFromEmail,
} from "@/lib/services/resend";
import { Order } from "@prisma/client";
import { NewOrderToDispatcherTemplate } from "@/domain/email/templates/NewOrderToDispatcher";

export const sendOrderEmailToDispatcher = async (
  order: Order,
  invoiceAttachment: {
    buffer: string;
    filename: string;
  }
) => {
  return await resend.emails.send({
    from: resendFromEmail,
    to: dispatcherToEmail,
    subject: `Ship new order to ${order.name}`,
    react: NewOrderToDispatcherTemplate({ order }),
    attachments: [
      {
        filename: invoiceAttachment.filename,
        content: invoiceAttachment.buffer,
      },
    ],
  });
};
