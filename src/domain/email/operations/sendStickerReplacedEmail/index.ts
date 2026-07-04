import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  StickerReplacedTemplate,
  type StickerReplacedEmailProps,
} from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";
import { getUserLocaleByEmail } from "@/domain/user/operations/getUserLocaleByEmail";

interface SendStickerReplacedEmailInput extends StickerReplacedEmailProps {
  customerEmail: string;
}

export const sendStickerReplacedEmail = async (
  input: SendStickerReplacedEmailInput
) => {
  const { customerEmail, ...templateProps } = input;

  if (isBlockedEmail(customerEmail)) {
    console.log(`Skipping email to blocked address: ${customerEmail}`);
    return null;
  }

  const locale = await getUserLocaleByEmail(customerEmail);
  const t = getEmailTranslator(locale, "emails.sticker");

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject: t("replaced.subject"),
    react: StickerReplacedTemplate({ ...templateProps, locale }),
  });
};
