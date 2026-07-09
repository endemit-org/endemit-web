"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
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
  /** Render the Pay button flush against the wallet balance card above it. */
  attached?: boolean;
  /** Increment to open the pay QR modal from the parent (e.g. tapping the
      wallet balance card). */
  openQrRequest?: number;
}

export default function BackupStickerInline({
  currentCode,
  walletBalance = null,
  receiveCode,
  attached = false,
  openQrRequest = 0,
}: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);

  // With nothing to spend, the big Pay button is just noise — hide it and
  // keep the wristband-link affordance.
  const canPay = (walletBalance ?? 0) > 0;

  // Parent-triggered open (wallet balance card tap).
  useEffect(() => {
    if (openQrRequest > 0) setIsQrOpen(true);
  }, [openQrRequest]);

  // ?pay=1 (e.g. the mobile menu's wallet bar) deep-links straight into the
  // pay QR modal; strip the param so a refresh doesn't reopen it.
  const autoOpenedRef = useRef(false);
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (searchParams.get("pay") === "1" && canPay) {
      autoOpenedRef.current = true;
      setIsQrOpen(true);
      router.replace("/profile", { scroll: false });
    }
  }, [searchParams, canPay, router]);

  return (
    <div className={attached ? "" : "mb-6"}>
      {canPay && (
        <button
          type="button"
          onClick={() => setIsQrOpen(true)}
          className={`group w-full flex items-center justify-between gap-3 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-medium transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:outline-none ${
            attached ? "rounded-b-lg" : "rounded-md"
          }`}
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
      )}

      {!currentCode && (
        <button
          type="button"
          onClick={() => setIsLinkOpen(true)}
          className="mt-2 w-full text-center text-xs text-blue-400 hover:text-blue-300 py-1"
        >
          {t("wristband.linkForOffline")}
        </button>
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
