import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface Props {
  code: string;
  magicLinkUrl: string;
  expiresInMinutes: number;
  locale?: string;
}

function OtcSignInTemplate({
  code,
  magicLinkUrl,
  expiresInMinutes,
  locale = "sl",
}: Props) {
  const t = getEmailTranslator(locale, "emails.otcSignIn");
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("heading")}</h1>
        <Text className="text-gray-600 mb-6">
          {t("intro", { minutes: expiresInMinutes })}
        </Text>

        <div
          style={{
            backgroundColor: "#f3f4f6",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <Text
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              letterSpacing: "8px",
              fontFamily: "monospace",
              margin: 0,
              color: "#111827",
            }}
          >
            {code}
          </Text>
        </div>

        <div
          style={{
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <Text className="text-gray-500 mb-4">{t("orClick")}</Text>
          <Link
            href={magicLinkUrl}
            style={{
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "12px 32px",
              borderRadius: "8px",
              fontWeight: "600",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {t("signInInstantly")}
          </Link>
        </div>

        <div
          className="bg-neutral-100 border border-neutral-200"
          style={{
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <Text className="text-sm text-neutral-600 my-0">
            {t("ignoreNote")}
          </Text>
        </div>

        <Text className="text-gray-600 text-sm">
          {t.rich("questions", {
            link: chunks => (
              <Link href="mailto:endemit@endemit.org" className="link">
                {chunks}
              </Link>
            ),
          })}
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { OtcSignInTemplate };
