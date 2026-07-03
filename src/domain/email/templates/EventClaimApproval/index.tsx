import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface Props {
  eventName: string;
  locale?: string;
}

function EventClaimApprovalTemplate({ eventName, locale = "sl" }: Props) {
  const t = getEmailTranslator(locale, "emails.eventClaim");
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("heading")}</h1>
        <Text className="text-gray-600 mb-6">
          {t.rich("body", {
            eventName,
            strong: chunks => <strong>{chunks}</strong>,
          })}
        </Text>

        <div
          style={{
            marginTop: "32px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/profile`}
            style={{
              display: "inline-block",
              backgroundColor: "#18181b",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {t("viewProfile")}
          </Link>
        </div>

        <Text className="text-gray-600 my-6">
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

export { EventClaimApprovalTemplate };
