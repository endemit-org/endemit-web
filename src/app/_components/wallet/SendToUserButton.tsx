"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const SendFundsModal = dynamic(
  () => import("@/app/_components/wallet/SendFundsModal"),
  { ssr: false }
);

interface Recipient {
  userId: string;
  username: string;
  name: string | null;
  image: string | null;
}

interface Props {
  recipient: Recipient;
  senderBalance: number;
}

/** "Send tokens" shortcut to a known user — opens the send modal on confirm. */
export default function SendToUserButton({ recipient, senderBalance }: Props) {
  const t = useTranslations("profile");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 17L17 7m0 0H9m8 0v8"
          />
        </svg>
        {t("transactions.sendTokens")}
      </button>
      <SendFundsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        senderBalance={senderBalance}
        initialRecipient={recipient}
      />
    </>
  );
}
