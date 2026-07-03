import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  RefundConfirmationTemplate,
  type RefundedItem,
} from "@/domain/email/templates/RefundConfirmation";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface SendRefundConfirmationEmailInput {
  orderId: string;
  orderEmail: string;
  refundedAmount: number;
  refundedItems: RefundedItem[];
  orderDate: Date | string;
  paymentMethodHint?: string;
  shippingRefunded?: number;
  locale?: string;
}

export const sendRefundConfirmationEmail = async (
  input: SendRefundConfirmationEmailInput
) => {
  if (isBlockedEmail(input.orderEmail)) {
    console.log(`Skipping refund email to blocked address: ${input.orderEmail}`);
    return null;
  }

  const t = getEmailTranslator(input.locale ?? "sl", "emails.refund");

  return await resend.emails.send({
    from: resendFromEmail,
    to: input.orderEmail,
    subject: t("subject"),
    react: RefundConfirmationTemplate({
      orderId: input.orderId,
      orderEmail: input.orderEmail,
      refundedAmount: input.refundedAmount,
      refundedItems: input.refundedItems,
      orderDate: input.orderDate,
      paymentMethodHint: input.paymentMethodHint,
      shippingRefunded: input.shippingRefunded,
      locale: input.locale,
    }),
  });
};
