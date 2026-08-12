import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  WalletAdjustmentTemplate,
  type WalletAdjustmentEmailProps,
} from "@/domain/email/templates";
import { getUserLocaleByEmail } from "@/domain/user/operations/getUserLocaleByEmail";

interface SendWalletAdjustmentEmailInput
  extends Omit<WalletAdjustmentEmailProps, "locale"> {
  customerEmail: string;
}

/**
 * Notifies a user about an admin balance adjustment. The subject and message
 * are written by the admin in the adjustment form.
 */
export const sendWalletAdjustmentEmail = async (
  input: SendWalletAdjustmentEmailInput
) => {
  const { customerEmail, ...templateProps } = input;

  if (isBlockedEmail(customerEmail)) {
    console.log(`Skipping email to blocked address: ${customerEmail}`);
    return null;
  }

  const locale = await getUserLocaleByEmail(customerEmail);

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject: templateProps.subject,
    react: WalletAdjustmentTemplate({ ...templateProps, locale }),
  });
};
