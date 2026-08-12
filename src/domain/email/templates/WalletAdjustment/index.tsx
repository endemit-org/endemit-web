import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text } from "@react-email/components";
import { formatTokensFromCents } from "@/lib/util/currency";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

export interface WalletAdjustmentEmailProps {
  direction: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  /** Admin-written subject, reused as the email heading. */
  subject: string;
  /** Admin-written reason/message shown to the user. */
  message: string | null;
  occurredAt: Date;
  locale?: string;
}

function WalletAdjustmentTemplate({
  direction,
  amount,
  balanceAfter,
  subject,
  message,
  occurredAt,
  locale = "sl",
}: WalletAdjustmentEmailProps) {
  const credit = direction === "credit";
  const t = getEmailTranslator(locale, "emails.walletAdjustment");
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
        <h1 className="text-2xl font-bold mb-2">{subject}</h1>
        <Text className="text-gray-500 mb-6">{formattedDate}</Text>

        {message && <Text className="text-gray-600 mb-6">{message}</Text>}

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
            {credit ? t("amountAdded") : t("amountRemoved")}
          </Text>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: 700,
              margin: 0,
              color: credit ? "#16a34a" : "#dc2626",
            }}
          >
            {credit ? "+" : "−"}
            {formatTokensFromCents(amount)}
          </Text>
        </div>

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
      </div>
    </MasterTemplate>
  );
}

export { WalletAdjustmentTemplate };
