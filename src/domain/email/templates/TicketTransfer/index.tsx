import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Button } from "@react-email/components";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

export interface TicketTransferOfferEmailProps {
  senderName: string;
  eventName: string;
  acceptUrl: string;
  expiresAt: Date;
  locale?: string;
}

export function TicketTransferOfferTemplate({
  senderName,
  eventName,
  acceptUrl,
  expiresAt,
  locale = "sl",
}: TicketTransferOfferEmailProps) {
  const t = getEmailTranslator(locale, "emails.ticketTransferOffer");
  const formattedExpiry = expiresAt.toLocaleString(
    locale === "en" ? "en-GB" : "sl-SI",
    { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          {t("title", { event: eventName })}
        </h1>
        <Text className="text-gray-600 mb-4">
          {t("body", { sender: senderName, event: eventName })}
        </Text>
        <Button
          href={acceptUrl}
          className="bg-black text-white px-6 py-3 rounded-lg font-semibold"
        >
          {t("acceptButton")}
        </Button>
        <Text className="text-gray-500 mt-6 text-sm">
          {t("expiry", { date: formattedExpiry })}
        </Text>
        <Text className="text-gray-400 mt-2 text-xs">{t("ignoreHint")}</Text>
      </div>
    </MasterTemplate>
  );
}

export interface TicketTransferAcceptedEmailProps {
  recipientEmail: string;
  eventName: string;
  locale?: string;
}

export function TicketTransferAcceptedTemplate({
  recipientEmail,
  eventName,
  locale = "sl",
}: TicketTransferAcceptedEmailProps) {
  const t = getEmailTranslator(locale, "emails.ticketTransferAccepted");

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("title")}</h1>
        <Text className="text-gray-600 mb-4">
          {t("body", { recipient: recipientEmail, event: eventName })}
        </Text>
        <Text className="text-gray-500 text-sm">{t("voidNote")}</Text>
      </div>
    </MasterTemplate>
  );
}
