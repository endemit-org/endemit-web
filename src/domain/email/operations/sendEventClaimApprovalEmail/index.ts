import "server-only";

import { resend, resendFromEmail } from "@/lib/services/resend";
import { EventClaimApprovalTemplate } from "@/domain/email/templates";

interface SendEventClaimApprovalEmailParams {
  email: string;
  eventName: string;
}

export const sendEventClaimApprovalEmail = async ({
  email,
  eventName,
}: SendEventClaimApprovalEmailParams) => {
  return await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: `${eventName} has been added to your profile`,
    react: EventClaimApprovalTemplate({ eventName }),
  });
};
