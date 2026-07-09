"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { formatTokensFromCents } from "@/lib/util/currency";
import AddToWalletButton from "@/app/_components/ticket/AddToWalletButton";
import { useWalletPassLabels } from "@/app/_hooks/useWalletPassLabels";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // Either or both. Wristband takes precedence when present.
  wristbandCode: string | null;
  receiveCode: string;
  walletBalance: number | null;
  onLinkWristband?: () => void;
}

export default function WalletPayQrModal({
  isOpen,
  onClose,
  wristbandCode,
  receiveCode,
  walletBalance,
  onLinkWristband,
}: Props) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const walletPassLabels = useWalletPassLabels();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Encode the wristband URL (printed form) when linked; fall back to the
  // signed receive code. Both resolve via the same server-side scan target,
  // so the register accepts either identically.
  const qrPayload = wristbandCode
    ? `${PUBLIC_BASE_WEB_URL}/s/${wristbandCode}`
    : receiveCode;

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(qrPayload, {
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [isOpen, qrPayload]);

  // Keep the screen awake while the QR is shown so the register has time
  // to scan without the display dimming.
  useEffect(() => {
    if (!isOpen) return;
    let sentinel: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then(lock => {
        sentinel = lock;
      })
      .catch(() => {});

    return () => {
      sentinel?.release().catch(() => {});
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Portal to <body>: rendered in place, ancestors' stacking contexts
  // (sticky sidebar, animation wrappers) trap the overlay under z-indexed
  // page content like artist/venue cards.
  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 rounded-2xl border border-neutral-700 shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {t("walletPay.pay")}
          </h2>
          <button
            onClick={onClose}
            aria-label={tc("close")}
            className="p-2 hover:bg-neutral-800 rounded-full text-neutral-400"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-full aspect-square bg-white rounded-xl flex items-center justify-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={
                  wristbandCode
                    ? t("wristband.qrAlt", { code: wristbandCode })
                    : t("wallet.payQrAlt")
                }
                className="w-full h-full rounded-xl"
              />
            ) : (
              <div className="w-3/4 h-3/4 bg-neutral-200 rounded-lg animate-pulse" />
            )}
          </div>

          {wristbandCode && (
            <p className="text-3xl font-mono font-bold tracking-[0.3em] text-neutral-200">
              {wristbandCode}
            </p>
          )}

          {/* The pass always encodes the receive code, so it works with or
              without a linked wristband. */}
          <div className="w-full">
            <AddToWalletButton
              size="sm"
              passUrl={`${PUBLIC_BASE_WEB_URL}/api/v1/wallet/wallet-pass/${encodeURIComponent(receiveCode)}`}
              labels={walletPassLabels}
            />
          </div>

          <div className="w-full bg-neutral-950 rounded-lg px-4 py-3 flex items-center justify-between border border-neutral-800">
            <span className="text-xs uppercase tracking-widest text-neutral-500">
              {t("walletPay.balance")}
            </span>
            <span className="font-mono text-neutral-200 text-lg">
              {walletBalance != null
                ? formatTokensFromCents(walletBalance)
                : "—"}
            </span>
          </div>

          <p className="text-xs text-neutral-500 text-center">
            {t("walletPay.handPhoneHint")}
          </p>

          {!wristbandCode && onLinkWristband && (
            <button
              type="button"
              onClick={onLinkWristband}
              className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
            >
              {t("wristband.linkForOffline")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
