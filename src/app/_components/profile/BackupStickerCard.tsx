"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations, useFormatter } from "next-intl";
import { useReducedMotion } from "framer-motion";
import QRCode from "qrcode";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import type { WristbandColor } from "@/app/_components/profile/WristbandScene";

const LinkStickerModal = dynamic(
  () => import("@/app/_components/profile/LinkStickerModal"),
  { ssr: false }
);

// three.js stage — client-only and heavy, so keep it out of the page bundle.
const WristbandScene = dynamic(
  () => import("@/app/_components/profile/WristbandScene"),
  { ssr: false }
);

interface Props {
  currentCode: string | null;
  claimedAt: string | null;
  /** Wristband color from the DB — null cycles the band's palette. */
  property: WristbandColor | null;
}

export default function BackupStickerCard({
  currentCode,
  claimedAt,
  property,
}: Props) {
  const t = useTranslations("profile");
  const format = useFormatter();
  const reducedMotion = useReducedMotion() ?? false;
  const router = useRouter();
  const [isLinking, setIsLinking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
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
    setIsLinking(true);
    setUnlinkError(null);
    try {
      const response = await fetch("/api/v1/wallet/sticker", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("wristband.unlinkFailed"));
      }
      setShowUnlinkConfirm(false);
      router.refresh();
    } catch (err) {
      setUnlinkError(
        err instanceof Error ? err.message : t("wristband.unlinkFailed")
      );
    } finally {
      setIsLinking(false);
    }
  }, [router, t]);

  return (
    <div className="bg-neutral-900 rounded-lg p-6 mt-6">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-neutral-200 mb-1">
            {t("wristband.title")}
          </h3>
          <p className="text-sm text-neutral-400">{t("wristband.desc")}</p>
        </div>
        {/* Idle spinning wristband — same GLB as the link modal, no intro/orb. */}
        <div aria-hidden className="w-28 h-28 flex-shrink-0 -my-4">
          <WristbandScene
            reducedMotion={reducedMotion}
            entrance={false}
            color={property}
            className="w-full h-full"
          />
        </div>
      </div>

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
                  date: format.dateTime(new Date(claimedAt), {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }),
                })}
              </p>
            )}
            <button
              onClick={() => {
                setUnlinkError(null);
                setShowUnlinkConfirm(true);
              }}
              disabled={isLinking}
              className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("wristband.unlink")}
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

      {/* Unlink confirmation modal - rendered via portal */}
      {showUnlinkConfirm &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => !isLinking && setShowUnlinkConfirm(false)}
          >
            <div
              className="bg-neutral-900 rounded-xl p-6 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                {t("wristband.unlink")}
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                {t("wristband.unlinkConfirm")}
              </p>
              {unlinkError && (
                <p className="text-sm text-red-400 mb-4">{unlinkError}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUnlinkConfirm(false)}
                  disabled={isLinking}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-200 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t("wristband.cancel")}
                </button>
                <button
                  onClick={handleUnlink}
                  disabled={isLinking}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLinking
                    ? t("wristband.unlinking")
                    : t("wristband.unlink")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
