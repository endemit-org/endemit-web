"use client";

import { useCallback, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import type {
  PaymentConfirmOrder,
  PaymentConfirmCustomer,
} from "@/app/_components/payment/PaymentConfirmView";

export interface StickerScanResult {
  order: PaymentConfirmOrder;
  customer: PaymentConfirmCustomer;
  hasEnoughBalance: boolean;
}

interface Props {
  orderHash: string;
  onScanned: (result: StickerScanResult) => void;
  onBack: () => void;
}

export function PosStickerScanView({ orderHash, onScanned, onBack }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCode = useCallback(
    async (rawCode: string) => {
      // Send the raw scanned value — server resolves either a wristband
      // URL/code or a signed receive code. Don't uppercase here: receive
      // codes are case-sensitive HMACs.
      const code = rawCode.trim();
      if (!code || isSubmitting) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/pos/orders/${orderHash}/scan-by-sticker`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stickerCode: code }),
          }
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to resolve sticker");
        }

        onScanned({
          order: data.order,
          customer: data.customer,
          hasEnoughBalance: data.hasEnoughBalance,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to resolve sticker"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onScanned, orderHash]
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

  return (
    <div className="bg-neutral-900 text-white -mx-6 -my-6 px-6 py-6 relative rounded-b-2xl">
      {isSubmitting && (
        <div className="absolute inset-0 z-10 bg-neutral-900/95 flex flex-col items-center justify-center rounded-b-2xl">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-medium">Resolving wristband...</p>
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Scan wristband</h3>
        <p className="text-sm text-neutral-400 mt-1">
          Point the camera at the customer&apos;s wristband, or type the 4-char
          code.
        </p>
      </div>

      <div className="relative rounded-lg overflow-hidden mb-2 bg-black">
        <Scanner
          onScan={handleQrScan}
          onError={err => console.error(err)}
          components={{
            finder: true,
            torch: true,
          }}
          styles={{
            container: {
              width: "100%",
            },
          }}
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
      <p className="text-xs text-neutral-500 text-center mb-4">
        Scan QR or type the 4-character wristband code
      </p>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <button
        onClick={onBack}
        className="w-full text-neutral-400 hover:text-neutral-200 text-sm py-2 transition-colors"
      >
        ← Back to QR
      </button>
    </div>
  );
}
