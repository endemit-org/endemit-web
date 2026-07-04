import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface InvalidatedTicket {
  shortId: string;
  eventName: string;
  ticketHolderName: string;
}

interface Props {
  tickets: InvalidatedTicket[];
  orderId: string;
  locale?: string;
}

function TicketInvalidationTemplate({ tickets, locale = "sl" }: Props) {
  const ticketCount = tickets.length;
  const t = getEmailTranslator(locale, "emails.ticketInvalidation");

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          {t("heading", { count: ticketCount })}
        </h1>

        {/* Warning Banner */}
        <div
          style={{
            marginTop: "24px",
            marginBottom: "24px",
            padding: "20px",
            backgroundColor: "#fef2f2",
            borderRadius: "8px",
            borderLeft: "4px solid #dc2626",
          }}
        >
          <Text
            style={{
              fontWeight: "bold",
              color: "#dc2626",
              marginBottom: "8px",
            }}
          >
            {t("importantNotice")}
          </Text>
          <Text className="text-gray-700">
            {t("warning", { count: ticketCount })}
          </Text>
        </div>

        {/* Invalidated Tickets List */}
        <h2 className="text-xl font-bold mb-4 mt-6">
          {t("listHeading", { count: ticketCount })}
        </h2>

        <table style={{ width: "100%", marginBottom: "24px" }}>
          <thead>
            <tr>
              <th
                align="left"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "12px 8px",
                  color: "#6b7280",
                }}
              >
                <Text className="font-semibold text-neutral-800">
                  {t("eventCol")}
                </Text>
              </th>
              <th
                align="left"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "12px 8px",
                  color: "#6b7280",
                }}
              >
                <Text className="font-semibold text-neutral-800">
                  {t("holderCol")}
                </Text>
              </th>
              <th
                align="left"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "12px 8px",
                  color: "#6b7280",
                }}
              >
                <Text className="font-semibold text-neutral-800">
                  {t("ticketIdCol")}
                </Text>
              </th>
              <th
                align="center"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "12px 8px",
                  color: "#6b7280",
                }}
              >
                <Text className="font-semibold text-neutral-800">
                  {t("statusCol")}
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, index) => (
              <tr key={`ticket-${index}`}>
                <td
                  align="left"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "12px 8px",
                  }}
                >
                  <Text className="font-medium">{ticket.eventName}</Text>
                </td>
                <td
                  align="left"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "12px 8px",
                  }}
                >
                  <Text>{ticket.ticketHolderName}</Text>
                </td>
                <td
                  align="left"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "12px 8px",
                  }}
                >
                  <Text className="font-mono text-sm">{ticket.shortId}</Text>
                </td>
                <td
                  align="center"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "12px 8px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: "#fecaca",
                      color: "#dc2626",
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {t("invalidBadge")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Information Box */}
        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <Text className="font-semibold mb-2">{t("whatDoesThisMean")}</Text>
          <ul style={{ margin: "0", paddingLeft: "20px", color: "#4b5563" }}>
            <li style={{ marginBottom: "8px" }}>
              <Text>{t("point1", { count: ticketCount })}</Text>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Text>{t("point2", { count: ticketCount })}</Text>
            </li>
            <li>
              <Text>{t("point3")}</Text>
            </li>
          </ul>
        </div>

        <Text className="text-gray-600 my-6 mt-8">
          {t.rich("questions", {
            link: chunks => (
              <Link href={"mailto:endemit@endemit.org"} className={"link"}>
                {chunks}
              </Link>
            ),
          })}
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { TicketInvalidationTemplate };
export type { Props as TicketInvalidationProps, InvalidatedTicket };
