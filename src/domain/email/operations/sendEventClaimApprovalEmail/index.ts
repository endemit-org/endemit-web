import "server-only";

import { resend, resendFromEmail } from "@/lib/services/resend";
import { EventClaimApprovalTemplate } from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";
import { getUserLocaleByEmail } from "@/domain/user/operations/getUserLocaleByEmail";

interface SendEventClaimApprovalEmailParams {
  email: string;
  eventName: string;
}

export const sendEventClaimApprovalEmail = async ({
  email,
  eventName,
}: SendEventClaimApprovalEmailParams) => {
  const locale = await getUserLocaleByEmail(email);
  const t = getEmailTranslator(locale, "emails.eventClaim");
  return await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: t("subject", { eventName }),
    react: EventClaimApprovalTemplate({ eventName, locale }),
  });
};
