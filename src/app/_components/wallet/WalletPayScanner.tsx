"use client";

import { useState, useCallback } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import { formatTokensFromCents, TOKEN_CONFIG } from "@/lib/util/currency";

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

const TIP_PRESETS = [
  { label: "No tip", value: 0 },
  { label: "12%", percent: 12 },
  { label: "25%", percent: 25 },
  { label: "Custom", value: -1 }, // -1 indicates custom
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
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
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
        setSelectedTip(0);
        setCustomTip("");
        setShowCustomTip(false);
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

  const calculateTip = useCallback(() => {
    if (showCustomTip && customTip) {
      return Math.round(parseFloat(customTip) * 100) || 0;
    }
    if (!scanResult || selectedTip <= 0) return 0;
    // Calculate debit total for percentage-based tips
    const debitItems = scanResult.order.items.filter(
      i => i.direction === "DEBIT"
    );
    const debitSum = debitItems.reduce((sum, i) => sum + i.total, 0);
    return Math.round((debitSum * selectedTip) / 100);
  }, [customTip, showCustomTip, selectedTip, scanResult]);

  const reset = useCallback(() => {
    setMode("scan");
    setScanResult(null);
    setSelectedTip(0);
    setCustomTip("");
    setShowCustomTip(false);
    setError(null);
    setIsCancelled(false);
    setIsScanning(false);
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
      <div className="bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-neutral-700 relative">
        {/* Loading overlay for scanning */}
        {isScanning && (
          <div className="absolute inset-0 z-10 bg-neutral-900/95 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-white font-medium">Loading order...</p>
          </div>
        )}

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
                disabled={isScanning}
                className="w-40 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center text-2xl font-mono uppercase disabled:opacity-50 placeholder-neutral-700"
                style={{ letterSpacing: "0.3em" }}
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
              {/* Items */}
              <div className="bg-neutral-800/50 rounded-lg divide-y divide-neutral-700/50 mb-4">
                {scanResult.order.items.map((item, i) => (
                  <div
                    key={i}
                    className="px-4 py-3 flex justify-between text-sm"
                  >
                    <span className="text-neutral-400">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-neutral-300">
                      {formatTokensFromCents(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tip selection - only show for non-top-up orders */}
              {!hasTopUp && (
                <div className="mb-4">
                  <div className="text-sm text-neutral-500 mb-2">
                    Add a tip?
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {TIP_PRESETS.map(preset => {
                      const isCustom = preset.value === -1;
                      const isSelected = isCustom
                        ? showCustomTip
                        : !showCustomTip &&
                          selectedTip ===
                            ("percent" in preset
                              ? preset.percent
                              : preset.value);

                      return (
                        <button
                          key={preset.label}
                          onClick={() => {
                            if (isCustom) {
                              setShowCustomTip(true);
                              setSelectedTip(0);
                            } else {
                              setShowCustomTip(false);
                              setCustomTip("");
                              const tipValue =
                                "percent" in preset
                                  ? preset.percent
                                  : preset.value;
                              setSelectedTip(tipValue ?? 0);
                            }
                          }}
                          className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                  {showCustomTip && (
                    <div className="mt-3">
                      <input
                        type="number"
                        placeholder={`Enter amount in ${TOKEN_CONFIG.symbol}`}
                        value={customTip}
                        onChange={e => setCustomTip(e.target.value)}
                        autoFocus
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-center text-lg"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Total - prominent */}
              <div className="bg-neutral-800 rounded-xl p-3 mb-4 text-center">
                <div className="text-neutral-500 text-sm mb-1">
                  {hasTopUp ? "Top-up Amount" : "Total to Pay"}
                </div>
                <div
                  className={`text-4xl font-bold ${hasTopUp ? "text-green-400" : "text-white"}`}
                >
                  {hasTopUp
                    ? `+${formatTokensFromCents(creditTotal)}`
                    : formatTokensFromCents(totalToPay)}
                </div>
                {tipAmount > 0 && (
                  <div className="text-neutral-500 text-sm mt-1">
                    includes {formatTokensFromCents(tipAmount)} tip
                  </div>
                )}
              </div>

              {/* Balance - toned down */}
              <div className="flex justify-between text-xs text-neutral-500 mb-1 px-1">
                <span>
                  Balance: {formatTokensFromCents(scanResult.customer.balance)}
                </span>
                <span>After: {formatTokensFromCents(balanceAfter)}</span>
              </div>

              {!canPay && (
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm text-center">
                  Insufficient balance. Please top up your wallet.
                </div>
              )}

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

        {/* Actions */}
        {mode === "confirm" && (
          <div className="px-6 pb-6 flex flex-col gap-3">
            <button
              onClick={handlePay}
              disabled={!canPay || isProcessing}
              className={`w-full px-4 py-4 text-white text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                hasTopUp
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isProcessing
                ? "Processing..."
                : hasTopUp
                  ? `Top-up ${formatTokensFromCents(creditTotal)}`
                  : `Pay ${formatTokensFromCents(totalToPay)}`}
            </button>
            <button
              onClick={reset}
              className="text-neutral-500 hover:text-neutral-300 text-sm py-2 transition-colors"
            >
              Cancel
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
