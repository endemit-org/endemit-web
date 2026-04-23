import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  StickerLinkedTemplate,
  type StickerLinkedEmailProps,
} from "@/domain/email/templates";

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

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject: "Your backup sticker is active",
    react: StickerLinkedTemplate(templateProps),
  });
};
