import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { formatTokensFromCents } from "@/lib/util/currency";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

type Direction = "sent" | "received";

interface Props {
  direction: Direction;
  amount: number;
  balanceAfter: number;
  counterpartyName: string;
  note: string | null;
  occurredAt: Date;
  transactionId: string;
  locale?: string;
}

function WalletTransferTemplate({
  direction,
  amount,
  balanceAfter,
  counterpartyName,
  note,
  occurredAt,
  transactionId,
  locale = "sl",
}: Props) {
  const sent = direction === "sent";
  const t = getEmailTranslator(locale, "emails.walletTransfer");
  const formattedDate = occurredAt.toLocaleString(
    locale === "en" ? "en-GB" : "sl-SI",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          {sent ? t("subjectSent") : t("subjectReceived")}
        </h1>
        <Text className="text-gray-500 mb-6">{formattedDate}</Text>

        <Text className="text-gray-600 mb-6">
          {t.rich(sent ? "descSent" : "descReceived", {
            amount: formatTokensFromCents(amount),
            name: counterpartyName,
            strong: chunks => <strong>{chunks}</strong>,
          })}
        </Text>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <Text className="text-gray-500 text-sm mb-1">
            {sent ? t("amountSent") : t("amountReceived")}
          </Text>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: 700,
              margin: 0,
              color: sent ? "#dc2626" : "#16a34a",
            }}
          >
            {sent ? "−" : "+"}
            {formatTokensFromCents(amount)}
          </Text>
        </div>

        {note && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#fafafa",
              borderLeft: "3px solid #d4d4d8",
              marginBottom: "24px",
            }}
          >
            <Text className="text-gray-500 text-xs mb-1">{t("note")}</Text>
            <Text className="text-gray-800 m-0">{note}</Text>
          </div>
        )}

        <div
          style={{
            marginTop: "32px",
            padding: "16px",
            backgroundColor: "#1e3a5f",
            borderRadius: "8px",
            border: "1px solid #3b82f6",
          }}
        >
          <Text className="font-semibold mb-2" style={{ color: "#93c5fd" }}>
            {t("walletBalance")}
          </Text>
          <Text
            className="text-2xl font-bold my-1"
            style={{ color: "#4ade80" }}
          >
            {formatTokensFromCents(balanceAfter)}
          </Text>
        </div>

        <div
          style={{
            marginBottom: "48px",
            marginTop: "24px",
            textAlign: "center",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "24px",
          }}
        >
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/profile/transactions/${transactionId}`}
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
            {t("viewTransaction")}
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

export { WalletTransferTemplate };
export type { Props as WalletTransferEmailProps };
