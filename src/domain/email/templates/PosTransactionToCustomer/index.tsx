import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { formatTokensFromCents } from "@/lib/util/currency";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

interface PosTransactionItem {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface Props {
  shortCode: string;
  registerName: string;
  items: PosTransactionItem[];
  subtotal: number;
  tipAmount: number;
  total: number;
  balanceAfter: number;
  paidAt: Date;
}

function PosTransactionToCustomerTemplate({
  shortCode,
  registerName,
  items,
  subtotal,
  tipAmount,
  total,
  balanceAfter,
  paidAt,
}: Props) {
  const formattedDate = paidAt.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">Transaction Confirmed</h1>
        <Text className="text-gray-800 mb-2">Transaction #{shortCode}</Text>
        <Text className="text-gray-500 mb-6">{formattedDate}</Text>

        <Text className="text-gray-600 mb-6">
          Your purchase at <strong>{registerName}</strong> has been completed
          successfully. Below are the details of your transaction.
        </Text>

        <h2 className="text-xl font-bold mb-2 mt-8">Items</h2>

        <table style={{ width: "100%", marginBottom: "16px" }}>
          <thead>
            <tr>
              <th
                align="left"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  Item
                </Text>
              </th>
              <th
                align="center"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">Qty</Text>
              </th>
              <th
                align="right"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  Price
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
                  Total
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`pos-item-${index}`}>
                <td
                  align="left"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>{item.name}</Text>
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
                  <Text>{formatTokensFromCents(item.unitCost)}</Text>
                </td>
                <td
                  align="right"
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "8px",
                  }}
                >
                  <Text>{formatTokensFromCents(item.total)}</Text>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table style={{ width: "100%", marginBottom: "24px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%" }}>&nbsp;</td>
              <td style={{ width: "50%" }}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td align="right" style={{ padding: "4px 0" }}>
                        <Text className="text-gray-600">Subtotal:</Text>
                      </td>
                      <td
                        align="right"
                        style={{ padding: "4px 0", paddingLeft: "16px" }}
                      >
                        <Text className="font-semibold">
                          {formatTokensFromCents(subtotal)}
                        </Text>
                      </td>
                    </tr>
                    {tipAmount > 0 && (
                      <tr>
                        <td align="right" style={{ padding: "4px 0" }}>
                          <Text className="text-gray-600">Tip:</Text>
                        </td>
                        <td
                          align="right"
                          style={{ padding: "4px 0", paddingLeft: "16px" }}
                        >
                          <Text className="font-semibold">
                            {formatTokensFromCents(tipAmount)}
                          </Text>
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td
                        align="right"
                        style={{
                          padding: "12px 0 4px 0",
                          borderTop: "2px solid #000",
                        }}
                      >
                        <Text className="font-bold">Total:</Text>
                      </td>
                      <td
                        align="right"
                        style={{
                          padding: "12px 0 4px 0",
                          paddingLeft: "16px",
                          borderTop: "2px solid #000",
                        }}
                      >
                        <Text className="font-bold text-lg">
                          {formatTokensFromCents(total)}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

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
            Wallet Balance
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
            href={`${PUBLIC_BASE_WEB_URL}/profile`}
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
            View Your Wallet
          </Link>
        </div>

        <Text className="text-gray-600 my-6">
          This email serves as a receipt for your transaction. If you have any
          questions, please contact us at{" "}
          <Link href={"mailto:endemit@endemit.org"} className={"link"}>
            endemit@endemit.org
          </Link>
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { PosTransactionToCustomerTemplate };
export type { Props as PosTransactionEmailProps, PosTransactionItem };
