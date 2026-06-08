"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLinked?: () => void;
}

export default function LinkStickerModal({ isOpen, onClose, onLinked }: Props) {
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
          throw new Error(data.error || "Failed to link sticker");
        }
        if (data.status === "linked" || data.status === "already_yours") {
          onLinked?.();
          router.refresh();
          onClose();
          return;
        }
        if (data.status === "conflict_other") {
          setError("This sticker is linked to another account.");
          return;
        }
        if (data.status === "swap_required") {
          setError(
            `You already have sticker ${data.existingCode} linked. Unlink it first.`
          );
          return;
        }
        setError("Unexpected response.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to link sticker");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onClose, onLinked, router]
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleClose}
    >
      <div
        className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Scan wristband</h2>
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
            Point your camera at the QR on your wristband.
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
  );
}
