import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  PosTransactionToCustomerTemplate,
  type PosTransactionEmailProps,
} from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";
import { getUserLocaleByEmail } from "@/domain/user/operations/getUserLocaleByEmail";

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

  const locale = await getUserLocaleByEmail(customerEmail);
  const t = getEmailTranslator(locale, "emails.posTransaction");

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject: t("subject", { code: templateProps.shortCode }),
    react: PosTransactionToCustomerTemplate({ ...templateProps, locale }),
  });
};
