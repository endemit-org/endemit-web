"use client";

import { useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
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
      setError("Order was cancelled by the seller");
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
          throw new Error(data.error || "Failed to scan order");
        }

        setScanResult(data);
        setMode("confirm");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to scan");
        setMode("error");
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning]
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
          throw new Error(data.error || "Payment failed");
        }

        setMode("success");
        setTimeout(() => {
          onPaymentComplete();
          handleClose();
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment failed");
      } finally {
        setIsProcessing(false);
      }
    },
    [scanResult, isProcessing, onPaymentComplete, handleClose]
  );

  if (!isOpen) return null;

  const creditTotal = scanResult
    ? scanResult.order.items
        .filter(i => i.direction === "CREDIT")
        .reduce((sum, i) => sum + i.total, 0)
    : 0;
  const hasTopUp = creditTotal > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700 relative">
        {isScanning && (
          <div className="absolute inset-0 z-10 bg-neutral-900/95 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-medium">Loading order...</p>
          </div>
        )}

        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {mode === "scan" && "Scan to Pay"}
            {mode === "confirm" && "Confirm Payment"}
            {mode === "success" && "Payment Complete"}
            {mode === "error" && "Error"}
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
              <p className="text-neutral-300 mb-4">
                Point your camera at the QR code
              </p>
              <div className="rounded-lg overflow-hidden mb-4">
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

              <input
                type="text"
                placeholder="AB12"
                maxLength={4}
                disabled={isScanning}
                className="w-40 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center text-2xl font-mono uppercase disabled:opacity-50 placeholder-neutral-700"
                style={{ letterSpacing: "0.3em" }}
                onChange={e => {
                  const value = e.target.value.toUpperCase();
                  e.target.value = value;
                  if (value.length === 4 && /^[A-Z]{2}[0-9]{2}$/.test(value)) {
                    handleScan(value);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    handleScan((e.target as HTMLInputElement).value);
                  }
                }}
              />
              <p className="text-xs text-neutral-500 mt-2">
                4-character code shown at register
              </p>
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
                {hasTopUp ? "Balance Topped Up" : "Payment Complete"}
              </h3>
              <p className="text-neutral-400 mt-2">
                {hasTopUp
                  ? `+${formatTokensFromCents(creditTotal)} added`
                  : "Thank you!"}
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
                {isCancelled ? "Order Cancelled" : "Error"}
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
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
