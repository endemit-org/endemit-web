import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text } from "@react-email/components";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

interface Props {
  code: string;
  locale?: string;
}

function StickerUnlinkedTemplate({ code, locale = "sl" }: Props) {
  const t = getEmailTranslator(locale, "emails.sticker");
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-4">{t("unlinked.heading")}</h1>

        <Text className="text-gray-600 mb-6">{t("unlinked.intro")}</Text>

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
            {t("unlinked.removedLabel")}
          </Text>
          <Text
            style={{
              fontFamily: "monospace",
              fontSize: "32px",
              fontWeight: 700,
              letterSpacing: "0.3em",
              margin: 0,
              textDecoration: "line-through",
              color: "#6b7280",
            }}
          >
            {code}
          </Text>
        </div>

        <Text className="text-gray-600 mb-6">{t("unlinked.outro")}</Text>
      </div>
    </MasterTemplate>
  );
}

export { StickerUnlinkedTemplate };
export type { Props as StickerUnlinkedEmailProps };
