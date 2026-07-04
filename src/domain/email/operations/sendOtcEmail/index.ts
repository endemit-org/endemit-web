import "server-only";

import { resend, resendFromEmail } from "@/lib/services/resend";
import { OtcSignInTemplate } from "@/domain/email/templates";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface SendOtcEmailParams {
  email: string;
  code: string;
  magicLink: string;
  expiresInMinutes: number;
  callbackUrl?: string;
  locale?: string;
}

export const sendOtcEmail = async ({
  email,
  code,
  magicLink,
  expiresInMinutes,
  callbackUrl,
  locale = "sl",
}: SendOtcEmailParams) => {
  const params = new URLSearchParams({
    token: magicLink,
    email,
  });
  if (callbackUrl) {
    params.set("callbackUrl", callbackUrl);
  }
  const magicLinkUrl = `${PUBLIC_BASE_WEB_URL}/api/v1/auth/magic-link?${params.toString()}`;

  const t = getEmailTranslator(locale, "emails.otcSignIn");

  return await resend.emails.send({
    from: resendFromEmail,
    to: email,
    subject: t("subject", { code }),
    react: OtcSignInTemplate({
      code,
      magicLinkUrl,
      expiresInMinutes,
      locale,
    }),
  });
};
