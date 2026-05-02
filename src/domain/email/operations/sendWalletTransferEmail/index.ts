import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  WalletTransferTemplate,
  type WalletTransferEmailProps,
} from "@/domain/email/templates";

interface SendWalletTransferEmailInput extends WalletTransferEmailProps {
  customerEmail: string;
}

export const sendWalletTransferEmail = async (
  input: SendWalletTransferEmailInput
) => {
  const { customerEmail, ...templateProps } = input;

  if (isBlockedEmail(customerEmail)) {
    console.log(`Skipping email to blocked address: ${customerEmail}`);
    return null;
  }

  const subject =
    templateProps.direction === "sent"
      ? "Funds sent"
      : "Funds received";

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject,
    react: WalletTransferTemplate(templateProps),
  });
};
