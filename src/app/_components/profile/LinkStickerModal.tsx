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
      const code = raw.trim().toUpperCase();
      if (!code || isSubmitting) return;
      if (!/^[A-Z]{2}[0-9]{2}$/.test(code)) {
        setError("Code must be 2 letters followed by 2 numbers (e.g. AB12)");
        return;
      }

      setIsSubmitting(true);
      setError(null);
      try {
        const response = await fetch("/api/v1/wallet/sticker/link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to link sticker");
        }
        onLinked?.();
        router.refresh();
        onClose();
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
          <h2 className="text-lg font-semibold text-white">
            Link Backup Sticker
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
            Scan the QR code on your sticker, or type the 4-char code.
          </p>

          <div className="relative rounded-lg overflow-hidden mb-2 bg-black">
            <Scanner
              onScan={handleQrScan}
              onError={err => console.error(err)}
              components={{ finder: true, torch: true }}
              styles={{ container: { width: "100%" } }}
            />
            <div className="absolute bottom-0 left-0 right-0 px-3 pt-8 pb-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex justify-center pointer-events-none">
              <input
                type="text"
                placeholder="AB12"
                maxLength={4}
                disabled={isSubmitting}
                className="pointer-events-auto w-36 px-3 py-2 bg-black/70 backdrop-blur border border-white/30 rounded-lg text-white text-center text-xl font-mono uppercase disabled:opacity-50 placeholder-white/30 focus:outline-none focus:border-white/60"
                style={{ letterSpacing: "0.3em" }}
                onChange={e => {
                  const value = e.target.value.toUpperCase();
                  e.target.value = value;
                  if (value.length === 4 && /^[A-Z]{2}[0-9]{2}$/.test(value)) {
                    submitCode(value);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    submitCode((e.target as HTMLInputElement).value);
                  }
                }}
              />
            </div>
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
