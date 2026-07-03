import * as React from "react";
import { TicketEmailData } from "@/domain/ticket/types/ticket";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Img, Text, Link } from "@react-email/components";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import { getResizedPrismicImage } from "@/lib/util/util";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface Props {
  ticket: TicketEmailData;
  locale?: string;
}

function NewTicketToCustomerTemplate({ ticket, locale = "sl" }: Props) {
  const t = getEmailTranslator(locale, "emails.newTicket");
  const loc: "sl" | "en" = locale === "en" ? "en" : "sl";

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          {t("heading", { name: ticket.ticketHolderName })}
        </h1>
        <Text className="text-gray-600 mb-6">
          {t("intro", {
            name: ticket.ticketHolderName,
            eventName: ticket.eventName,
          })}
        </Text>
        <Text className="text-gray-600 mb-6">
          {t.rich("useOptions", {
            profile: chunks => (
              <Link
                href={`${PUBLIC_BASE_WEB_URL}/profile/tickets/${ticket.shortId}`}
              >
                {chunks}
              </Link>
            ),
            wallet: chunks => (
              <Link
                href={`${PUBLIC_BASE_WEB_URL}/api/v1/tickets/wallet-pass/${ticket.ticketHash}`}
              >
                {chunks}
              </Link>
            ),
            ios: chunks => <span className={"italic"}>{chunks}</span>,
          })}
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
                      src={getResizedPrismicImage(ticket.eventPromoImageUrl, {
                        width: 240,
                      })}
                      alt={ticket.eventName}
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
                  <Text className="font-bold text-lg mb-2">
                    {ticket.eventName}
                  </Text>
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
                            {formatEventDateAndTime(ticket.eventDate, loc)}
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
                            <Link href={ticket.mapUrl}>{ticket.address}</Link>
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

        <table
          style={{
            width: "100%",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "16px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", width: "120px" }}>
                <Text className="text-neutral-600 text-sm my-1">
                  {t("ticketHolder")}
                </Text>
              </td>
              <td style={{ padding: "4px 0" }}>
                <Text className="font-semibold text-sm my-1">
                  {ticket.ticketHolderName}
                </Text>
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 0" }}>
                <Text className="text-neutral-600 text-sm my-1">
                  {t("email")}
                </Text>
              </td>
              <td style={{ padding: "4px 0" }}>
                <Text className="font-semibold text-sm my-1">
                  {ticket.ticketPayerEmail}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            marginTop: "48px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/profile/tickets/${ticket.shortId}`}
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
            {t("viewOnline")}
          </Link>
        </div>

        <div style={{ marginBottom: "48px", textAlign: "center" }}>
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/api/v1/tickets/wallet-pass/${ticket.ticketHash}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#000000",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
              border: "1px solid #404040",
            }}
          >
            <Img
              src={`${PUBLIC_BASE_WEB_URL}/images/apple_wallet.png`}
              alt="Apple Wallet"
              width={28}
              height={22}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                marginRight: "6px",
              }}
            />
            {t("addToWallet")}
          </Link>
        </div>

        <div
          className="bg-neutral-800 border border-neutral-700"
          style={{
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <Text className="text-sm font-semibold mb-1 text-neutral-200 mt-0">
            {t("importantInfo")}
          </Text>
          <Text className="text-sm text-neutral-400 my-1">
            • {t("infoValidOne")}
            <br />• {t("infoNonRefundable")}
            <br />•{" "}
            {t.rich("infoCodeOfConduct", {
              link: chunks => (
                <Link
                  href={`${PUBLIC_BASE_WEB_URL}/code-of-conduct`}
                  className="link"
                >
                  {chunks}
                </Link>
              ),
            })}
            <br />• {t("infoVenueTerms")}
            <br />• {t("infoShowQr")}
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

export { NewTicketToCustomerTemplate };
