"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useTranslations } from "next-intl";

const LinkStickerModal = dynamic(
  () => import("@/app/_components/profile/LinkStickerModal"),
  { ssr: false }
);

const WalletPayQrModal = dynamic(
  () => import("@/app/_components/profile/WalletPayQrModal"),
  { ssr: false }
);

interface Props {
  currentCode: string | null;
  walletBalance?: number | null;
  receiveCode: string;
}

function InfoButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("profile");
  return (
    <button
      type="button"
      aria-label={t("wristband.whatIsThis")}
      aria-expanded={isOpen}
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="flex-shrink-0 w-6 h-6 rounded-full border border-neutral-700 text-neutral-500 hover:text-neutral-200 hover:border-neutral-500 flex items-center justify-center text-xs transition-colors"
    >
      ?
    </button>
  );
}

export default function BackupStickerInline({
  currentCode,
  walletBalance = null,
  receiveCode,
}: Props) {
  const t = useTranslations("profile");
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const toggleInfo = () => setIsInfoOpen(v => !v);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          className="group flex-1 flex items-center justify-between gap-3 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-medium transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:outline-none"
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4h4v4H4V4zm0 8h4v4H4v-4zm0 8h4v-4h4v4H8v-4H4v4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v-4h4v4h-4v-4h-4v4zm8-16h-4v4h4V4zm0 8h-4v4h4v-4z"
              />
            </svg>
            <span className="text-base">{t("walletPay.pay")}</span>
          </span>
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest text-blue-100/80">
            {currentCode ? (
              <span className="font-mono tracking-[0.25em] text-white text-sm">
                {currentCode}
              </span>
            ) : (
              <span>{t("wristband.showQr")}</span>
            )}
            <svg
              className="w-4 h-4 text-blue-100/70 group-hover:translate-x-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </button>
        <InfoButton isOpen={isInfoOpen} onToggle={toggleInfo} />
      </div>

      {!currentCode && (
        <button
          type="button"
          onClick={() => setIsLinkOpen(true)}
          className="mt-2 w-full text-center text-xs text-blue-400 hover:text-blue-300 py-1"
        >
          {t("wristband.linkForOffline")}
        </button>
      )}

      {isInfoOpen && (
        <p className="mt-2 px-3 py-2 text-xs text-neutral-400 bg-neutral-900 border border-neutral-800 rounded-lg leading-relaxed">
          {t("wristband.infoText")}
        </p>
      )}

      <LinkStickerModal
        isOpen={isLinkOpen}
        onClose={() => setIsLinkOpen(false)}
      />

      <WalletPayQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        wristbandCode={currentCode}
        receiveCode={receiveCode}
        walletBalance={walletBalance}
        onLinkWristband={
          currentCode
            ? undefined
            : () => {
                setIsQrOpen(false);
                setIsLinkOpen(true);
              }
        }
      />
    </div>
  );
}
