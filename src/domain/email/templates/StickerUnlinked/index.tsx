import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text } from "@react-email/components";

interface Props {
  code: string;
}

function StickerUnlinkedTemplate({ code }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-4">Your backup sticker was removed</h1>

        <Text className="text-gray-600 mb-6">
          The backup sticker below is no longer linked to your Endemit wallet
          and can&apos;t be used to pay at POS registers anymore.
        </Text>

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f3f4f6",
            borderRadius: "8px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <Text className="text-gray-500 text-sm mb-1">Removed code</Text>
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

        <Text className="text-gray-600 mb-6">
          You can link a new sticker any time from your profile settings.
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { StickerUnlinkedTemplate };
export type { Props as StickerUnlinkedEmailProps };
