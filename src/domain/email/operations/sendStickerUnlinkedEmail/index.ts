import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import {
  StickerUnlinkedTemplate,
  type StickerUnlinkedEmailProps,
} from "@/domain/email/templates";

interface SendStickerUnlinkedEmailInput extends StickerUnlinkedEmailProps {
  customerEmail: string;
}

export const sendStickerUnlinkedEmail = async (
  input: SendStickerUnlinkedEmailInput
) => {
  const { customerEmail, ...templateProps } = input;

  if (isBlockedEmail(customerEmail)) {
    console.log(`Skipping email to blocked address: ${customerEmail}`);
    return null;
  }

  return await resend.emails.send({
    from: resendFromEmail,
    to: customerEmail,
    subject: "Your backup sticker was removed",
    react: StickerUnlinkedTemplate(templateProps),
  });
};
