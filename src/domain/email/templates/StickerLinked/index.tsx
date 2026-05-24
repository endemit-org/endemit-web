import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text } from "@react-email/components";

interface Props {
  code: string;
}

function StickerLinkedTemplate({ code }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-4">Your backup sticker is active</h1>

        <Text className="text-gray-600 mb-6">
          A backup sticker is now linked to your Endemit wallet. Keep it
          somewhere safe — a wallet, keychain, or phone case works well.
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
          <Text className="text-gray-500 text-sm mb-1">Your sticker code</Text>
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

        <h2 className="text-lg font-semibold mb-2">How to use it</h2>
        <Text className="text-gray-600 mb-6">
          If your phone is dead or missing at a POS register, hand the sticker
          to the cashier. They can scan it (or type the code) and the payment
          screen will appear on their device for you to confirm.
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { StickerLinkedTemplate };
export type { Props as StickerLinkedEmailProps };
