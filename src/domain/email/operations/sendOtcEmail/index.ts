import "server-only";

import { resend, resendFromEmail } from "@/lib/services/resend";
import { OtcSignInTemplate } from "@/domain/email/templates";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

interface SendOtcEmailParams {
  email: string;
  code: string;
  magicLink: string;
  expiresInMinutes: number;
}

export const sendOtcEmail = async ({
  email,
  code,
  magicLink,
  expiresInMinutes,
}: SendOtcEmailParams) => {
  const magicLinkUrl = `${PUBLIC_BASE_WEB_URL}/api/v1/auth/magic-link?token=${magicLink}&email=${encodeURIComponent(email)}`;

  return await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: `Your sign-in code: ${code}`,
    react: OtcSignInTemplate({
      code,
      magicLinkUrl,
      expiresInMinutes,
    }),
  });
};
