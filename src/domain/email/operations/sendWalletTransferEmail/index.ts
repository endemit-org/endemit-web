import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  WalletTransferTemplate,
  type WalletTransferEmailProps,
} from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";
import { getUserLocaleByEmail } from "@/domain/user/operations/getUserLocaleByEmail";

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

  const locale = await getUserLocaleByEmail(customerEmail);
  const t = getEmailTranslator(locale, "emails.walletTransfer");
  const subject =
    templateProps.direction === "sent"
      ? t("subjectSent")
      : t("subjectReceived");

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject,
    react: WalletTransferTemplate({ ...templateProps, locale }),
  });
};
