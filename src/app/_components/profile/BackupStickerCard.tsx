"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

const LinkStickerModal = dynamic(
  () => import("@/app/_components/profile/LinkStickerModal"),
  { ssr: false }
);

interface Props {
  currentCode: string | null;
  claimedAt: string | null;
}

export default function BackupStickerCard({ currentCode, claimedAt }: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [isLinking, setIsLinking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Encode the same URL the printed wristband uses, so this on-screen QR
  // is a 1:1 substitute when scanned at a register.
  useEffect(() => {
    if (!currentCode) {
      setQrDataUrl(null);
      return;
    }
    const url = `${PUBLIC_BASE_WEB_URL}/s/${currentCode}`;
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [currentCode]);

  const handleUnlink = useCallback(async () => {
    if (!confirm(t("wristband.unlinkConfirm"))) return;
    setIsLinking(true);
    try {
      const response = await fetch("/api/v1/wallet/sticker", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("wristband.unlinkFailed"));
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : t("wristband.unlinkFailed"));
    } finally {
      setIsLinking(false);
    }
  }, [router, t]);

  return (
    <div className="bg-neutral-900 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold text-neutral-200 mb-1">
        {t("wristband.title")}
      </h3>
      <p className="text-sm text-neutral-400 mb-4">{t("wristband.desc")}</p>

      {currentCode ? (
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={t("wristband.qrAlt", { code: currentCode })}
                className="w-full h-full rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-neutral-200 rounded-lg animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-mono font-bold tracking-[0.3em] text-neutral-200">
              {currentCode}
            </p>
            {claimedAt && (
              <p className="text-xs text-neutral-500 mt-1 mb-3">
                {t("wristband.linkedOn", {
                  date: new Date(claimedAt).toLocaleDateString(),
                })}
              </p>
            )}
            <button
              onClick={handleUnlink}
              disabled={isLinking}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLinking ? t("wristband.unlinking") : t("wristband.unlink")}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          {t("wristband.scan")}
        </button>
      )}

      <LinkStickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
