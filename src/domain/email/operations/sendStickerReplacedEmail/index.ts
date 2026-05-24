import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  StickerReplacedTemplate,
  type StickerReplacedEmailProps,
} from "@/domain/email/templates";

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

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject: "Your backup sticker was updated",
    react: StickerReplacedTemplate(templateProps),
  });
};
