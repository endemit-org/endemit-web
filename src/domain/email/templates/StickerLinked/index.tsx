import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text } from "@react-email/components";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface Props {
  code: string;
  locale?: string;
}

function StickerLinkedTemplate({ code, locale = "sl" }: Props) {
  const t = getEmailTranslator(locale, "emails.sticker");
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-4">{t("linked.heading")}</h1>

        <Text className="text-gray-600 mb-6">{t("linked.intro")}</Text>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <Text className="text-gray-500 text-sm mb-1">
            {t("linked.codeLabel")}
          </Text>
          <Text
            style={{
              fontFamily: "monospace",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "0.3em",
              margin: 0,
            }}
          >
            {code}
          </Text>
        </div>

        <h2 className="text-lg font-semibold mb-2">
          {t("howToUseHeading")}
        </h2>
        <Text className="text-gray-600 mb-6">{t("howToUseBody")}</Text>
      </div>
    </MasterTemplate>
  );
}

export { StickerLinkedTemplate };
export type { Props as StickerLinkedEmailProps };
