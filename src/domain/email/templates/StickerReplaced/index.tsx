import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text } from "@react-email/components";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface Props {
  oldCode: string;
  newCode: string;
  locale?: string;
}

function StickerReplacedTemplate({ oldCode, newCode, locale = "sl" }: Props) {
  const t = getEmailTranslator(locale, "emails.sticker");
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-4">{t("replaced.heading")}</h1>

        <Text className="text-gray-600 mb-6">{t("replaced.intro")}</Text>

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
                    {t("replaced.oldLabel")}
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
                  <Text className="text-green-700 text-xs mb-1">
                    {t("replaced.newLabel")}
                  </Text>
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

        <h2 className="text-lg font-semibold mb-2">
          {t("howToUseHeading")}
        </h2>
        <Text className="text-gray-600 mb-6">{t("howToUseBody")}</Text>
      </div>
    </MasterTemplate>
  );
}

export { StickerReplacedTemplate };
export type { Props as StickerReplacedEmailProps };
