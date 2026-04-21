"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Scanner } from "@yudiel/react-qr-scanner";

interface Props {
  currentCode: string | null;
  claimedAt: string | null;
}

export default function BackupStickerCard({ currentCode, claimedAt }: Props) {
  const router = useRouter();
  const [isLinking, setIsLinking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = useCallback(() => {
    setError(null);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setError(null);
  }, [isSubmitting]);

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
        setIsModalOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to link sticker");
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, router]
  );

  const handleUnlink = useCallback(async () => {
    if (!confirm("Unlink this backup sticker?")) return;
    setIsLinking(true);
    try {
      const response = await fetch("/api/v1/wallet/sticker", {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to unlink sticker");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unlink sticker");
    } finally {
      setIsLinking(false);
    }
  }, [router]);

  const handleQrScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (result && result.length > 0 && !isSubmitting) {
        const value = result[0].rawValue.trim();
        if (value) submitCode(value);
      }
    },
    [isSubmitting, submitCode]
  );

  return (
    <div className="bg-neutral-900 rounded-lg p-6 mt-6">
      <h3 className="text-lg font-semibold text-neutral-200 mb-1">
        Backup Sticker
      </h3>
      <p className="text-sm text-neutral-400 mb-4">
        Link a pre-printed sticker to your account so you can still pay at POS
        registers if your phone dies.
      </p>

      {currentCode ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-mono font-bold tracking-[0.3em] text-neutral-200">
              {currentCode}
            </p>
            {claimedAt && (
              <p className="text-xs text-neutral-500 mt-1">
                Linked on {new Date(claimedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={handleUnlink}
            disabled={isLinking}
            className="px-4 py-2 text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLinking ? "Unlinking..." : "Unlink"}
          </button>
        </div>
      ) : (
        <button
          onClick={openModal}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Link a sticker
        </button>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeModal}
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
                onClick={closeModal}
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

              <div className="rounded-lg overflow-hidden mb-4 bg-black">
                <Scanner
                  onScan={handleQrScan}
                  onError={err => console.error(err)}
                  components={{ finder: true, torch: true }}
                  styles={{ container: { width: "100%" } }}
                />
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-neutral-900 text-neutral-500 text-sm">
                    or enter code
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <input
                  type="text"
                  placeholder="AB12"
                  maxLength={4}
                  disabled={isSubmitting}
                  className="w-40 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center text-2xl font-mono uppercase disabled:opacity-50 placeholder-neutral-700"
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

              {error && (
                <div className="mt-4 bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
