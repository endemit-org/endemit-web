import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  PosTransactionToCustomerTemplate,
  type PosTransactionEmailProps,
} from "@/domain/email/templates";

interface SendPosTransactionEmailInput extends PosTransactionEmailProps {
  customerEmail: string;
}

export const sendPosTransactionEmail = async (
  input: SendPosTransactionEmailInput
) => {
  const { customerEmail, ...templateProps } = input;

  if (isBlockedEmail(customerEmail)) {
    console.log(`Skipping email to blocked address: ${customerEmail}`);
    return null;
  }

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject: `Transaction Receipt #${templateProps.shortCode} @ endemit`,
    react: PosTransactionToCustomerTemplate(templateProps),
  });
};
