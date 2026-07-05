import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Img, Text, Link, Hr } from "@react-email/components";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import { getResizedPrismicImage } from "@/lib/util/util";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface TicketInfo {
  shortId: string;
  ticketHash: string;
  ticketHolderName: string;
  ticketPayerEmail: string;
  price: number;
  qrContent: unknown;
  metadata?: Record<string, unknown> | null;
}

interface EventReminderProps {
  eventName: string;
  eventDate: Date;
  eventPromoImageUrl: string;
  venue: {
    name: string;
    address: string;
    mapUrl: string;
  };
  artists: { name: string }[];
  tickets: TicketInfo[];
  locale?: string;
}

function EventReminderTemplate({
  eventName,
  eventDate,
  eventPromoImageUrl,
  venue,
  artists,
  tickets,
  locale = "sl",
}: EventReminderProps) {
  const ticketCount = tickets.length;
  const t = getEmailTranslator(locale, "emails.eventReminder");
  const loc: "sl" | "en" = locale === "en" ? "en" : "sl";

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("heading", { eventName })}</h1>
        <Text className="text-gray-600 mb-6">
          {t("intro", { count: ticketCount, eventName })}
        </Text>

        <div
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <table style={{ width: "100%", marginBottom: "24px" }}>
            <tbody>
              <tr>
                <td
                  style={{
                    width: "120px",
                    verticalAlign: "top",
                    paddingRight: "24px",
                  }}
                >
                  <div
                    style={{
                      width: "120px",
                      height: "120px",
                      overflow: "hidden",
                      borderRadius: "8px",
                    }}
                  >
                    <Img
                      src={getResizedPrismicImage(eventPromoImageUrl, {
                        width: 240,
                      })}
                      alt={eventName}
                      width={120}
                      height={120}
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                </td>
                <td style={{ verticalAlign: "top" }}>
                  <Text className="font-bold text-lg mb-2">{eventName}</Text>
                  <table style={{ width: "100%" }}>
                    <tbody>
                      <tr>
                        <td
                          style={{
                            padding: "4px 0",
                            verticalAlign: "top",
                            width: "80px",
                          }}
                        >
                          <Text className="text-neutral-600 text-sm my-0">
                            {t("date")}
                          </Text>
                        </td>
                        <td style={{ padding: "4px 0" }}>
                          <Text className="font-semibold text-sm my-0">
                            {formatEventDateAndTime(eventDate, loc)}
                          </Text>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: "4px 0", verticalAlign: "top" }}>
                          <Text className="text-neutral-600 text-sm my-0">
                            {t("location")}
                          </Text>
                        </td>
                        <td style={{ padding: "4px 0" }}>
                          <Text className="font-semibold text-sm my-0">
                            <Link href={venue.mapUrl}>{venue.address}</Link>
                          </Text>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Artist Lineup */}
        {artists.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <Text className="font-semibold text-base mb-2">{t("lineup")}</Text>
            <Text className="text-neutral-600 text-sm my-0 uppercase">
              {artists.map(a => a.name).join(" • ")}
            </Text>
          </div>
        )}

        <Hr className="border-gray-200 my-6" />

        {/* Tickets Section */}
        <div style={{ marginBottom: "24px" }}>
          <Text className="font-semibold text-base mb-4">
            {t("yourTickets", { count: ticketCount })}
          </Text>

          {tickets.map((ticket, index) => (
            <div
              key={ticket.shortId}
              style={{
                backgroundColor: "#fafafa",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: index < tickets.length - 1 ? "12px" : "0",
              }}
            >
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td>
                      <Text className="font-medium text-sm my-0">
                        {ticket.ticketHolderName}
                      </Text>
                      <Text className="text-xs text-neutral-500 my-1">
                        {ticket.shortId}
                      </Text>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        href={`${PUBLIC_BASE_WEB_URL}/profile/tickets/${ticket.shortId}`}
                        style={{
                          color: "#3b82f6",
                          fontSize: "12px",
                          textDecoration: "none",
                          marginRight: "12px",
                        }}
                      >
                        {t("view")}
                      </Link>
                      <Link
                        href={`${PUBLIC_BASE_WEB_URL}/api/v1/tickets/wallet-pass/${ticket.ticketHash}`}
                        style={{
                          color: "#3b82f6",
                          fontSize: "12px",
                          textDecoration: "none",
                        }}
                      >
                        {t("appleWallet")}
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "32px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/profile/tickets`}
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
            {t("viewAll")}
          </Link>
        </div>

        <div
          className="bg-neutral-800 border border-neutral-700"
          style={{
            borderRadius: "8px",
            padding: "16px",
            marginTop: "32px",
            marginBottom: "24px",
          }}
        >
          <Text className="text-sm font-semibold mb-1 text-neutral-200 mt-0">
            {t("reminder")}
          </Text>
          <Text className="text-sm text-neutral-400 my-1">
            • {t("reminderShowQr")}
            <br />• {t("reminderOnePerson")}
            <br />•{" "}
            {t.rich("reminderCodeOfConduct", {
              link: chunks => (
                <Link
                  href={`${PUBLIC_BASE_WEB_URL}/code-of-conduct`}
                  className="link"
                >
                  {chunks}
                </Link>
              ),
            })}
          </Text>
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

export { EventReminderTemplate };
export type { EventReminderProps, TicketInfo };
