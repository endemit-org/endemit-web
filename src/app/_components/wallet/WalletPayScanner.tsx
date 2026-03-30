"use client";

import { useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";

interface OrderDetails {
  id: string;
  shortCode: string;
  orderHash: string;
  subtotal: number;
  total: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    total: number;
    direction: "CREDIT" | "DEBIT";
  }>;
  register: { id: string; name: string };
}

interface ScanResult {
  order: OrderDetails;
  customer: { id: string; name: string | null; balance: number };
  hasEnoughBalance: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

const TIP_PRESETS = [
  { label: "No tip", value: 0 },
  { label: "10%", percent: 10 },
  { label: "15%", percent: 15 },
  { label: "20%", percent: 20 },
];

export function WalletPayScanner({
  isOpen,
  onClose,
  onPaymentComplete,
}: Props) {
  const [mode, setMode] = useState<"scan" | "confirm" | "success" | "error">(
    "scan"
  );
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedTip, setSelectedTip] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  // Listen for order cancellation
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

  const handleScan = useCallback(async (hash: string) => {
    if (!hash.trim()) return;

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
      setSelectedTip(0);
      setCustomTip("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan");
      setMode("error");
    }
  }, []);

  const handleQrScan = useCallback(
    (result: { rawValue: string }[]) => {
      if (result && result.length > 0 && mode === "scan") {
        const hash = result[0].rawValue.trim();
        if (hash) {
          handleScan(hash);
        }
      }
    },
    [handleScan, mode]
  );

  const calculateTip = useCallback(() => {
    if (customTip) {
      return Math.round(parseFloat(customTip) * 100) || 0;
    }
    if (!scanResult) return 0;
    // Calculate debit total for percentage-based tips
    const debitItems = scanResult.order.items.filter(
      i => i.direction === "DEBIT"
    );
    const debitSum = debitItems.reduce((sum, i) => sum + i.total, 0);
    const preset = TIP_PRESETS.find(
      t => t.value === selectedTip || t.percent === selectedTip
    );
    if (preset && "percent" in preset && preset.percent !== undefined) {
      return Math.round((debitSum * preset.percent) / 100);
    }
    return 0;
  }, [customTip, selectedTip, scanResult]);

  const reset = useCallback(() => {
    setMode("scan");
    setScanResult(null);
    setSelectedTip(0);
    setCustomTip("");
    setError(null);
    setIsCancelled(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handlePay = useCallback(async () => {
    if (!scanResult || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const tipAmount = calculateTip();

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
  }, [scanResult, isProcessing, calculateTip, onPaymentComplete, handleClose]);

  if (!isOpen) return null;

  // Calculate credit and debit totals
  const creditTotal = scanResult
    ? scanResult.order.items
        .filter(i => i.direction === "CREDIT")
        .reduce((sum, i) => sum + i.total, 0)
    : 0;
  const debitTotal = scanResult
    ? scanResult.order.items
        .filter(i => i.direction === "DEBIT")
        .reduce((sum, i) => sum + i.total, 0)
    : 0;

  const hasTopUp = creditTotal > 0;
  const tipAmount = hasTopUp ? 0 : calculateTip(); // No tip for top-ups
  const totalToPay = debitTotal + tipAmount;
  const balanceAfter = scanResult
    ? scanResult.customer.balance + creditTotal - totalToPay
    : 0;
  const canPay = scanResult && balanceAfter >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700">
        {/* Header */}
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

        {/* Content */}
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
                className="w-32 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center text-2xl font-mono uppercase tracking-widest"
                onChange={e => {
                  const value = e.target.value.toUpperCase();
                  e.target.value = value;
                  // Auto-submit when 4 characters entered
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
            <>
              <div className="mb-4">
                <div className="text-sm text-neutral-400 mb-1">
                  {scanResult.order.register.name}
                </div>
                <div className="font-mono text-lg text-white">
                  Order {scanResult.order.shortCode}
                </div>
              </div>

              {/* Items */}
              <div className="bg-neutral-800 rounded-lg divide-y divide-neutral-700 mb-4">
                {scanResult.order.items.map((item, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 flex justify-between text-sm"
                  >
                    <span className="text-neutral-300">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-white font-medium">
                      {formatPrice(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tip selection - only show for non-top-up orders */}
              {!hasTopUp && (
                <div className="mb-4">
                  <div className="text-sm text-neutral-400 mb-2">
                    Add a tip?
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TIP_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => {
                          const tipValue =
                            "percent" in preset ? preset.percent : preset.value;
                          setSelectedTip(tipValue ?? 0);
                          setCustomTip("");
                        }}
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedTip ===
                            ("percent" in preset
                              ? preset.percent
                              : preset.value) && !customTip
                            ? "bg-blue-600 text-white"
                            : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <input
                      type="number"
                      placeholder="Custom tip (€)"
                      value={customTip}
                      onChange={e => {
                        setCustomTip(e.target.value);
                        setSelectedTip(0);
                      }}
                      className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="bg-neutral-800 rounded-lg p-4 mb-4">
                {creditTotal > 0 && (
                  <div className="flex justify-between text-sm text-green-400 mb-2">
                    <span>Top-up</span>
                    <span>+{formatPrice(creditTotal)}</span>
                  </div>
                )}
                {debitTotal > 0 && (
                  <div className="flex justify-between text-sm text-neutral-400 mb-2">
                    <span>Purchase</span>
                    <span>-{formatPrice(debitTotal)}</span>
                  </div>
                )}
                {tipAmount > 0 && (
                  <div className="flex justify-between text-sm text-neutral-400 mb-2">
                    <span>Tip</span>
                    <span>-{formatPrice(tipAmount)}</span>
                  </div>
                )}
              </div>

              {/* Balance preview */}
              <div
                className={`rounded-lg p-4 mb-4 ${canPay ? "bg-neutral-800" : "bg-red-900/30 border border-red-700/50"}`}
              >
                <div className="flex items-center justify-between text-sm text-neutral-400 mb-2">
                  <span>Current balance</span>
                  <span>{formatPrice(scanResult.customer.balance)}</span>
                </div>
                <div
                  className={`flex items-center justify-between text-lg font-bold pt-2 border-t border-neutral-700 ${canPay ? "text-white" : "text-red-400"}`}
                >
                  <span>New balance</span>
                  <span>{formatPrice(balanceAfter)}</span>
                </div>
                {!canPay && (
                  <p className="text-xs text-red-400 mt-2">
                    Insufficient balance. Please top up your wallet.
                  </p>
                )}
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
                  {error}
                </div>
              )}
            </>
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
                {hasTopUp ? `+${formatPrice(creditTotal)} added` : "Thank you!"}
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

        {/* Actions */}
        {mode === "confirm" && (
          <div className="px-6 py-4 border-t border-neutral-700 flex gap-3">
            <button
              onClick={reset}
              className="flex-1 px-4 py-3 border border-neutral-600 rounded-lg text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={!canPay || isProcessing}
              className={`flex-1 px-4 py-3 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                hasTopUp
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isProcessing
                ? "Processing..."
                : hasTopUp
                  ? `Top-up ${formatPrice(creditTotal)}`
                  : `Pay ${formatPrice(totalToPay)}`}
            </button>
          </div>
        )}

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
