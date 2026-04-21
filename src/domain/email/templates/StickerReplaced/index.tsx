import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text } from "@react-email/components";

interface Props {
  oldCode: string;
  newCode: string;
}

function StickerReplacedTemplate({ oldCode, newCode }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-4">Your backup sticker was updated</h1>

        <Text className="text-gray-600 mb-6">
          Your previous backup sticker has been replaced. The old code will no
          longer work at POS registers — only the new one below.
        </Text>

        <table style={{ width: "100%", marginBottom: "24px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", padding: "8px" }}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <Text className="text-gray-500 text-xs mb-1">
                    Old (removed)
                  </Text>
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: "22px",
                      fontWeight: 700,
                      letterSpacing: "0.25em",
                      margin: 0,
                      textDecoration: "line-through",
                      color: "#6b7280",
                    }}
                  >
                    {oldCode}
                  </Text>
                </div>
              </td>
              <td style={{ width: "50%", padding: "8px" }}>
                <div
                  style={{
                    padding: "16px",
                    backgroundColor: "#ecfdf5",
                    borderRadius: "8px",
                    textAlign: "center",
                  }}
                >
                  <Text className="text-green-700 text-xs mb-1">New (active)</Text>
                  <Text
                    style={{
                      fontFamily: "monospace",
                      fontSize: "22px",
                      fontWeight: 700,
                      letterSpacing: "0.25em",
                      margin: 0,
                      color: "#065f46",
                    }}
                  >
                    {newCode}
                  </Text>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <h2 className="text-lg font-semibold mb-2">How to use it</h2>
        <Text className="text-gray-600 mb-6">
          If your phone is dead or missing at a POS register, hand the new
          sticker to the cashier. They can scan it (or type the code) and the
          payment screen will appear on their device for you to confirm.
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { StickerReplacedTemplate };
export type { Props as StickerReplacedEmailProps };
