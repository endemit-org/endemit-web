"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";
import ModalPortal from "@/app/_components/ui/ModalPortal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLinked?: () => void;
}

export default function LinkStickerModal({ isOpen, onClose, onLinked }: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setError(null);
    onClose();
  }, [isSubmitting, onClose]);

  const submitCode = useCallback(
    async (raw: string) => {
      if (!raw || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/v1/wallet/sticker/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: raw }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || t("wristband.linkFailed"));
        }
        if (data.status === "linked" || data.status === "already_yours") {
          onLinked?.();
          router.refresh();
          onClose();
          return;
        }
        if (data.status === "conflict_other") {
          setError(t("wristband.stickerConflictOther"));
          return;
        }
        if (data.status === "swap_required") {
          setError(
            t("wristband.stickerSwapRequired", { code: data.existingCode })
          );
          return;
        }
        setError(t("wristband.unexpectedResponse"));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t("wristband.linkFailed")
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onClose, onLinked, router, t]
  );

  const handleQrScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (result && result.length > 0 && !isSubmitting) {
        const value = result[0].rawValue.trim();
        if (value) submitCode(value);
      }
    },
    [isSubmitting, submitCode]
  );

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80"
        onClick={handleClose}
      >
        <div
          className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {t("wristband.scan")}
            </h2>
            <button
              onClick={handleClose}
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

          <div className="p-6">
            <p className="text-sm text-neutral-400 mb-4 text-center">
              {t("wristband.scanHint")}
            </p>

            <div className="relative rounded-lg overflow-hidden bg-black">
              <Scanner
                onScan={handleQrScan}
                onError={err => console.error(err)}
                components={{ finder: true, torch: true }}
                styles={{ container: { width: "100%" } }}
              />
            </div>

            {error && (
              <div className="mt-4 bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
