import * as React from "react";
import { TicketEmailData } from "@/domain/ticket/types/ticket";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Img, Text, Link } from "@react-email/components";
import { formatEventDateAndTime } from "@/lib/util/formatting";

interface Props {
  ticket: TicketEmailData;
}

function NewTicketToCustomerTemplate({ ticket }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          {ticket.ticketHolderName}, your Ticket is Ready!
        </h1>
        <Text className="text-gray-600 mb-6">
          Hi {ticket.ticketHolderName}, your secure ticket for{" "}
          {ticket.eventName} was generated. Please save this email and present
          the attached ticket at the entrance of the event.
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
                      src={ticket.eventCoverImageUrl}
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
                            Date:
                          </Text>
                        </td>
                        <td style={{ padding: "4px 0" }}>
                          <Text className="font-semibold text-sm my-0">
                            {formatEventDateAndTime(ticket.eventDate)}
                          </Text>
                        </td>
                      </tr>

                      <tr>
                        <td style={{ padding: "4px 0", verticalAlign: "top" }}>
                          <Text className="text-neutral-600 text-sm my-0">
                            Location:
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

        <div
          className="bg-neutral-800 border border-neutral-700"
          style={{
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          <Text className="text-sm font-semibold mb-1 text-neutral-200 mt-0">
            Important Information
          </Text>
          <Text className="text-sm text-neutral-400 my-1">
            • This ticket is valid for one person
            <br />
            • Ticket is non-refundable, but you can transfer it to someone else
            <br />
            • Event entry is subject to venue&#39;s terms and conditions
            <br />• Show this QR code at the entrance
          </Text>
        </div>

        <table
          style={{
            width: "100%",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "16px",
          }}
        >
          <tbody>
            <tr>
              <td style={{ padding: "4px 0", width: "120px" }}>
                <Text className="text-neutral-600 text-sm my-1">
                  Ticket holder:
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
                <Text className="text-neutral-600 text-sm my-1">Email:</Text>
              </td>
              <td style={{ padding: "4px 0" }}>
                <Text className="font-semibold text-sm my-1">
                  {ticket.ticketPayerEmail}
                </Text>
              </td>
            </tr>
          </tbody>
        </table>

        <Text className="text-gray-600 my-6">
          Questions? Contact us at{" "}
          <Link href="mailto:endemit@endemit.org" className="link">
            endemit@endemit.org
          </Link>
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { NewTicketToCustomerTemplate };
