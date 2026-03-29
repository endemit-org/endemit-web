"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";

interface PosOrderSummary {
  id: string;
  shortCode: string;
  orderHash: string;
  subtotal: number;
  total: number;
  status: string;
  scannedAt: string | null;
  expiresAt: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
    total: number;
  }>;
  customerName?: string;
  customerBalance?: number;
  hasEnoughBalance?: boolean;
  tipAmount?: number;
  paidAt?: string;
}

interface Props {
  order: PosOrderSummary;
  onClose: () => void;
  onCancel: () => void;
  onCopyToCart: () => void;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function PosOrderQrModal({
  order,
  onClose,
  onCancel,
  onCopyToCart,
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(order.orderHash, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    }).then(setQrDataUrl);
  }, [order.orderHash]);

  const isPaid = order.status === "PAID";
  const isScanned = !!order.scannedAt;
  const hasTip = (order.tipAmount ?? 0) > 0;

  // Fire confetti when tip is received
  const fireConfetti = useCallback(() => {
    // Quick burst of confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ["#22c55e", "#16a34a", "#fbbf24", "#f59e0b"],
    });
  }, []);

  useEffect(() => {
    if (isPaid && hasTip && !hasShownConfetti) {
      setHasShownConfetti(true);
      fireConfetti();
    }
  }, [isPaid, hasTip, hasShownConfetti, fireConfetti]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Order {order.shortCode}</h2>
            <p className="text-sm text-gray-500">{formatPrice(order.total)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
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
          {isPaid ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg
                  className="w-10 h-10 text-green-600"
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
              </div>
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Payment Received
              </h3>
              <p className="text-2xl font-bold mb-1">
                {formatPrice(order.total)}
              </p>
              {hasTip && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-white font-semibold shadow-lg animate-pulse">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>+{formatPrice(order.tipAmount!)} tip</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Large Short Code */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">Order Code</p>
                <p className="text-5xl font-mono font-bold tracking-[0.3em] text-gray-900">
                  {order.shortCode}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Order QR Code"
                    className="w-48 h-48 rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse" />
                )}
              </div>

              <p className="text-center text-sm text-gray-500 mb-4">
                {formatPrice(order.total)}
              </p>

              {/* Status */}
              {isScanned ? (
                <div
                  className={`rounded-lg p-4 mb-4 ${
                    order.hasEnoughBalance === false
                      ? "bg-red-50 border border-red-200"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        order.hasEnoughBalance === false
                          ? "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      {order.hasEnoughBalance === false ? (
                        <svg
                          className="w-5 h-5 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {order.customerName || "Customer"} scanned
                      </p>
                      <p className="text-sm text-gray-600">
                        Balance: {formatPrice(order.customerBalance || 0)}
                        {order.hasEnoughBalance === false && (
                          <span className="text-red-600 ml-1">
                            (Insufficient)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 mb-4">
                  Waiting for customer to scan...
                </p>
              )}

              {/* Items */}
              <div className="border rounded-lg divide-y text-sm">
                {order.items.map((item, i) => (
                  <div key={i} className="px-3 py-2 flex justify-between">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        {!isPaid && (
          <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={onCopyToCart}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              Cancel & Edit
            </button>
          </div>
        )}

        {isPaid && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
