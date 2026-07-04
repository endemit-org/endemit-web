import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface RefundedItem {
  itemName: string;
  quantity: number;
  amount: number; // In cents
}

interface Props {
  orderId: string;
  orderEmail: string;
  refundedAmount: number; // In cents
  refundedItems: RefundedItem[];
  orderDate: Date | string;
  paymentMethodHint?: string; // e.g., "Visa ending in 4242"
  shippingRefunded?: number; // In cents
  locale?: string;
}

function formatCents(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | string, locale: "sl" | "en"): string {
  return new Date(date).toLocaleDateString(locale === "sl" ? "sl-SI" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function RefundConfirmationTemplate({
  orderId,
  refundedAmount,
  refundedItems,
  orderDate,
  paymentMethodHint,
  shippingRefunded,
  locale = "sl",
}: Props) {
  const t = getEmailTranslator(locale, "emails.refund");
  const loc: "sl" | "en" = locale === "en" ? "en" : "sl";
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">{t("heading")}</h1>
        <Text className="text-gray-600 mb-6">{t("intro")}</Text>

        {/* Refund Amount */}
        <div
          style={{
            marginTop: "24px",
            marginBottom: "24px",
            padding: "24px",
            backgroundColor: "#ecfdf5",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <Text className="text-gray-600 mb-1">{t("refundAmount")}</Text>
          <Text
            style={{
              fontSize: "32px",
              fontWeight: "bold",
              color: "#059669",
              margin: "8px 0",
            }}
          >
            {formatCents(refundedAmount)}
          </Text>
          {paymentMethodHint && (
            <Text className="text-gray-500 text-sm mt-2">
              {t("refundedTo", { method: paymentMethodHint })}
            </Text>
          )}
        </div>

        {/* Order Details */}
        <div
          style={{
            marginBottom: "24px",
            padding: "16px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
          }}
        >
          <Text className="font-semibold mb-2">{t("orderDetails")}</Text>
          <Text className="text-neutral-700 my-1">
            {t("orderIdLabel", { id: orderId.slice(-8).toUpperCase() })}
          </Text>
          <Text className="text-neutral-700 my-1">
            {t("orderDateLabel", { date: formatDate(orderDate, loc) })}
          </Text>
        </div>

        {/* Refunded Items */}
        <h2 className="text-xl font-bold mb-2 mt-6">{t("refundedItems")}</h2>

        <table style={{ width: "100%", marginBottom: "16px" }}>
          <thead>
            <tr>
              <th
                align="left"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                  color: "#6b7280",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  {t("item")}
                </Text>
              </th>
              <th
                align="center"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  {t("qty")}
                </Text>
              </th>
              <th
                align="right"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  {t("refundCol")}
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {refundedItems.map((item, index) => (
              <tr key={`refund-item-${index}`}>
                <td
                  align="left"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>{item.itemName}</Text>
                </td>
                <td
                  align="center"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>{item.quantity}</Text>
                </td>
                <td
                  align="right"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>{formatCents(item.amount)}</Text>
                </td>
              </tr>
            ))}
            {shippingRefunded && shippingRefunded > 0 && (
              <tr>
                <td
                  align="left"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>{t("shipping")}</Text>
                </td>
                <td
                  align="center"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>1</Text>
                </td>
                <td
                  align="right"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>{formatCents(shippingRefunded)}</Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Total */}
        <table style={{ width: "100%", marginBottom: "24px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%" }}>&nbsp;</td>
              <td style={{ width: "50%" }}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td
                        align="right"
                        style={{
                          padding: "12px 0 4px 0",
                          borderTop: "2px solid #000",
                        }}
                      >
                        <Text className="font-bold">{t("totalRefunded")}</Text>
                      </td>
                      <td
                        align="right"
                        style={{
                          padding: "12px 0 4px 0",
                          paddingLeft: "16px",
                          borderTop: "2px solid #000",
                        }}
                      >
                        <Text className="font-bold text-lg text-green-600">
                          {formatCents(refundedAmount)}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* View Order Button */}
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

        <Text className="text-gray-600 my-6">
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

export { RefundConfirmationTemplate };
export type { Props as RefundConfirmationProps, RefundedItem };
