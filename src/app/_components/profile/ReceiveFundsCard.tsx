"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import ModalPortal from "@/app/_components/ui/ModalPortal";

interface Props {
  receiveCode: string;
}

export default function ReceiveFundsCard({ receiveCode }: Props) {
  const t = useTranslations("profile");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(receiveCode, {
      width: 512,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [receiveCode]);

  useEffect(() => {
    if (!isQrModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsQrModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isQrModalOpen]);

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/send/${encodeURIComponent(receiveCode)}`;
    if (navigator.share) {
      try {
        await navigator.share({ url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-neutral-900 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold text-neutral-200 mb-1">
        {t("wallet.receiveFunds")}
      </h3>
      <p className="text-sm text-neutral-400 mb-4">
        {t("wallet.receiveFundsDesc")}
      </p>

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => setIsQrModalOpen(true)}
          aria-label={t("wallet.enlargeQr")}
          className="w-32 h-32 bg-white rounded-lg flex items-center justify-center hover:ring-2 hover:ring-blue-500 transition-shadow"
        >
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={t("wallet.receiveQrAlt")}
              className="w-full h-full rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200 rounded-lg animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={handleShareLink}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
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
              d="M8.684 13.342a3 3 0 100-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684zm0-9.316a3 3 0 105.368-2.684 3 3 0 00-5.368 2.684z"
            />
          </svg>
          {linkCopied ? t("wallet.linkCopied") : t("wallet.shareLink")}
        </button>
      </div>

      {/* Enlarged QR modal — the sender scans this from their Send funds flow. */}
      {isQrModalOpen && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setIsQrModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="bg-neutral-900 border border-neutral-700 rounded-2xl p-6 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <h4 className="text-lg font-semibold text-neutral-200 mb-1">
                {t("wallet.receiveFunds")}
              </h4>
              <p className="text-sm text-neutral-400 mb-4">
                {t("wallet.receiveQrInstruction")}
              </p>
              <div className="bg-white rounded-xl p-3 mx-auto w-full max-w-[288px]">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt={t("wallet.receiveQrAlt")}
                    className="w-full h-full"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="mt-4 w-full px-4 py-2 text-sm text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-lg transition-colors"
              >
                {t("wallet.closeQr")}
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
