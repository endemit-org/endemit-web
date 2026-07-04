import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  StickerLinkedTemplate,
  type StickerLinkedEmailProps,
} from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";
import { getUserLocaleByEmail } from "@/domain/user/operations/getUserLocaleByEmail";

interface SendStickerLinkedEmailInput extends StickerLinkedEmailProps {
  customerEmail: string;
}

export const sendStickerLinkedEmail = async (
  input: SendStickerLinkedEmailInput
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
    subject: t("linked.subject"),
    react: StickerLinkedTemplate({ ...templateProps, locale }),
  });
};
