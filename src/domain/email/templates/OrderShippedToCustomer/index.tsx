import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface Props {
  orderId: string;
  locale?: string;
}

function OrderShippedToCustomerTemplate({ orderId, locale = "sl" }: Props) {
  const t = getEmailTranslator(locale, "emails.orderShipped");
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("heading")}</h1>
        <Text className="text-gray-800 mb-2">
          {t("orderNumber", { id: orderId })}
        </Text>
        <Text className="text-gray-600 mb-6">{t("body")}</Text>

        <div
          style={{
            marginBottom: "32px",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/profile/orders/${orderId}`}
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
            {t("viewOrder")}
          </Link>
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

export { OrderShippedToCustomerTemplate };
