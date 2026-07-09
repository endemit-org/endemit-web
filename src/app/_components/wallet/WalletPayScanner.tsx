"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Scanner } from "@yudiel/react-qr-scanner";
import ModalPortal from "@/app/_components/ui/ModalPortal";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import { formatTokensFromCents } from "@/lib/util/currency";
import {
  PaymentConfirmView,
  type PaymentConfirmOrder,
  type PaymentConfirmCustomer,
} from "@/app/_components/payment/PaymentConfirmView";

interface ScanResult {
  order: PaymentConfirmOrder;
  customer: PaymentConfirmCustomer;
  hasEnoughBalance: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export function WalletPayScanner({
  isOpen,
  onClose,
  onPaymentComplete,
}: Props) {
  const t = useTranslations("profile.walletPay");
  const [mode, setMode] = useState<"scan" | "confirm" | "success" | "error">(
    "scan"
  );
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  useRealtimeChannel({
    channelName: scanResult ? `pos:order:${scanResult.order.id}` : "",
    event: "pos_order_cancelled",
    onMessage: () => {
      setIsCancelled(true);
      setMode("error");
      setError(t("orderCancelledBySeller"));
    },
    enabled: !!scanResult && mode === "confirm",
  });

  const handleScan = useCallback(
    async (hash: string) => {
      if (!hash.trim() || isScanning) return;

      setIsScanning(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/pos/orders/${hash}/scan`, {
          method: "POST",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t("scanFailed"));
        }

        setScanResult(data);
        setMode("confirm");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("scanFailed"));
        setMode("error");
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, t]
  );

  const handleQrScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (result && result.length > 0 && mode === "scan" && !isScanning) {
        const hash = result[0].rawValue.trim();
        if (hash) {
          handleScan(hash);
        }
      }
    },
    [handleScan, mode, isScanning]
  );

  const reset = useCallback(() => {
    setMode("scan");
    setScanResult(null);
    setError(null);
    setIsCancelled(false);
    setIsScanning(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handlePay = useCallback(
    async (tipAmount: number) => {
      if (!scanResult || isProcessing) return;

      setIsProcessing(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/v1/pos/orders/${scanResult.order.orderHash}/pay`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tipAmount }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || t("paymentFailed"));
        }

        setMode("success");
        setTimeout(() => {
          onPaymentComplete();
          handleClose();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("paymentFailed"));
      } finally {
        setIsProcessing(false);
      }
    },
    [scanResult, isProcessing, onPaymentComplete, handleClose, t]
  );

  if (!isOpen) return null;

  const creditTotal = scanResult
    ? scanResult.order.items
        .filter(i => i.direction === "CREDIT")
        .reduce((sum, i) => sum + i.total, 0)
    : 0;
  const hasTopUp = creditTotal > 0;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80">
        <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700 relative">
          {isScanning && (
            <div className="absolute inset-0 z-10 bg-neutral-900/95 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-white font-medium">{t("loadingOrder")}</p>
            </div>
          )}

          <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {mode === "scan" && t("scanTitle")}
              {mode === "confirm" && t("confirmTitle")}
              {mode === "success" && t("successTitle")}
              {mode === "error" && t("errorTitle")}
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
            {mode === "scan" && (
              <div className="text-center">
                <p className="text-neutral-300 mb-4">{t("pointCamera")}</p>
                <div className="relative rounded-lg overflow-hidden mb-2 bg-black">
                  <Scanner
                    onScan={handleQrScan}
                    onError={error => console.error(error)}
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
                      disabled={isScanning}
                      className="pointer-events-auto w-36 px-3 py-2 bg-black/70 backdrop-blur border border-white/30 rounded-lg text-white text-center text-xl font-mono uppercase disabled:opacity-50 placeholder-white/30 focus:outline-none focus:border-white/60"
                      style={{ letterSpacing: "0.3em" }}
                      onChange={e => {
                        const value = e.target.value.toUpperCase();
                        e.target.value = value;
                        if (
                          value.length === 4 &&
                          /^[A-Z]{2}[0-9]{2}$/.test(value)
                        ) {
                          handleScan(value);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          handleScan((e.target as HTMLInputElement).value);
                        }
                      }}
                    />
                  </div>
                </div>
                <p className="text-xs text-neutral-500">{t("scanCodeHint")}</p>
              </div>
            )}

            {mode === "confirm" && scanResult && (
              <PaymentConfirmView
                order={scanResult.order}
                customer={scanResult.customer}
                allowCustomTip
                isProcessing={isProcessing}
                error={error}
                onPay={handlePay}
                onCancel={reset}
              />
            )}

            {mode === "success" && (
              <div className="text-center py-8">
                <div
                  className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${hasTopUp ? "bg-emerald-900/50" : "bg-green-900/50"}`}
                >
                  {hasTopUp ? (
                    <svg
                      className="w-10 h-10 text-emerald-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-10 h-10 text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
                <h3
                  className={`text-xl font-semibold ${hasTopUp ? "text-emerald-400" : "text-green-400"}`}
                >
                  {hasTopUp ? t("toppedUpTitle") : t("successTitle")}
                </h3>
                <p className="text-neutral-400 mt-2">
                  {hasTopUp
                    ? t("amountAdded", {
                        amount: formatTokensFromCents(creditTotal),
                      })
                    : t("thankYou")}
                </p>
              </div>
            )}

            {mode === "error" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-900/50 flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-red-400"
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
                </div>
                <h3 className="text-xl font-semibold text-red-400">
                  {isCancelled ? t("orderCancelledTitle") : t("errorTitle")}
                </h3>
                <p className="text-neutral-400 mt-2">{error}</p>
              </div>
            )}
          </div>

          {mode === "error" && (
            <div className="px-6 py-4 border-t border-neutral-700">
              <button
                onClick={reset}
                className="w-full px-4 py-3 bg-neutral-800 text-white rounded-lg hover:bg-neutral-700"
              >
                {t("tryAgain")}
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
