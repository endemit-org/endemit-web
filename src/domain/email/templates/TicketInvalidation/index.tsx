import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";

interface InvalidatedTicket {
  shortId: string;
  eventName: string;
  ticketHolderName: string;
}

interface Props {
  tickets: InvalidatedTicket[];
  orderId: string;
}

function TicketInvalidationTemplate({ tickets }: Props) {
  const ticketCount = tickets.length;
  const ticketText = ticketCount === 1 ? "ticket" : "tickets";

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          {ticketCount === 1 ? "Ticket Invalidated" : "Tickets Invalidated"}
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
            Important Notice
          </Text>
          <Text className="text-gray-700">
            The following {ticketText} {ticketCount === 1 ? "is" : "are"} no
            longer valid and cannot be used for event entry. This is due to a
            refund being processed for the associated order.
          </Text>
        </div>

        {/* Invalidated Tickets List */}
        <h2 className="text-xl font-bold mb-4 mt-6">
          Invalidated {ticketCount === 1 ? "Ticket" : "Tickets"}
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
                <Text className="font-semibold text-neutral-800">Event</Text>
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
                  Ticket Holder
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
                  Ticket ID
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
                <Text className="font-semibold text-neutral-800">Status</Text>
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
                    INVALID
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
          <Text className="font-semibold mb-2">What does this mean?</Text>
          <ul style={{ margin: "0", paddingLeft: "20px", color: "#4b5563" }}>
            <li style={{ marginBottom: "8px" }}>
              <Text>
                {ticketCount === 1 ? "This ticket" : "These tickets"} cannot be
                used for entry at the event.
              </Text>
            </li>
            <li style={{ marginBottom: "8px" }}>
              <Text>
                Any QR codes or digital passes associated with{" "}
                {ticketCount === 1 ? "this ticket" : "these tickets"} will not
                scan.
              </Text>
            </li>
            <li>
              <Text>
                If you believe this is an error, please contact our support team
                immediately.
              </Text>
            </li>
          </ul>
        </div>

        <Text className="text-gray-600 my-6 mt-8">
          If you have any questions, please contact our support team at{" "}
          <Link href={"mailto:endemit@endemit.org"} className={"link"}>
            endemit@endemit.org
          </Link>
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { TicketInvalidationTemplate };
export type { Props as TicketInvalidationProps, InvalidatedTicket };
