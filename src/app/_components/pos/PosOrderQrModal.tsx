"use client";

import { useEffect, useState, useCallback } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import { formatTokensFromCents } from "@/lib/util/currency";
import Image from "next/image";
import {
  PosStickerScanView,
  type StickerScanResult,
} from "./PosStickerScanView";
import { PaymentConfirmView } from "@/app/_components/payment/PaymentConfirmView";

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
  customerFirstName?: string | null;
  customerImage?: string | null;
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

const AUTO_CLOSE_SECONDS = 30;

type SubView = "qr" | "sticker-scan" | "customer-confirm";

export function PosOrderQrModal({
  order,
  onClose,
  onCancel,
  onCopyToCart,
}: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(
    null
  );
  const [subView, setSubView] = useState<SubView>("qr");
  const [stickerScan, setStickerScan] = useState<StickerScanResult | null>(
    null
  );
  const [isRotated, setIsRotated] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

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

  // Start auto-close countdown when paid
  useEffect(() => {
    if (isPaid && autoCloseCountdown === null) {
      setAutoCloseCountdown(AUTO_CLOSE_SECONDS);
    }
  }, [isPaid, autoCloseCountdown]);

  // Countdown timer
  useEffect(() => {
    if (autoCloseCountdown === null || autoCloseCountdown <= 0) return;

    const timer = setTimeout(() => {
      setAutoCloseCountdown(autoCloseCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCloseCountdown]);

  // Auto-close when countdown reaches 0
  useEffect(() => {
    if (autoCloseCountdown === 0) {
      onClose();
    }
  }, [autoCloseCountdown, onClose]);

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

  // Reset sub-view state when the order becomes paid
  useEffect(() => {
    if (isPaid) {
      setSubView("qr");
      setStickerScan(null);
      setPayError(null);
    }
  }, [isPaid]);

  const handleStickerScanned = useCallback((result: StickerScanResult) => {
    setStickerScan(result);
    setSubView("customer-confirm");
    setPayError(null);
  }, []);

  const handlePay = useCallback(
    async (tipAmount: number) => {
      if (!stickerScan || isPaying) return;
      setIsPaying(true);
      setPayError(null);
      try {
        const response = await fetch(
          `/api/v1/pos/orders/${stickerScan.order.orderHash}/pay`,
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
      } catch (err) {
        setPayError(err instanceof Error ? err.message : "Payment failed");
      } finally {
        setIsPaying(false);
      }
    },
    [stickerScan, isPaying]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="text-xl  text-center w-full">
            Your total is{" "}
            <span className={"font-bold"}>
              {formatTokensFromCents(order.total)}
            </span>
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
                {formatTokensFromCents(order.total)}
              </p>
              {hasTip && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-amber-900 font-semibold shadow-lg animate-pulse">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>+{formatTokensFromCents(order.tipAmount!)} tip</span>
                </div>
              )}
            </div>
          ) : subView === "qr" ? (
            <div>
              {/* Large Short Code */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">Order Code</p>
                <p className="text-5xl font-mono font-bold tracking-[0.3em] text-gray-900">
                  {order.shortCode}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-4">
                {qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt="Order QR Code"
                    className="w-48 h-48 rounded-lg"
                    unoptimized
                    width={256}
                    height={256}
                  />
                ) : (
                  <div className="w-48 h-48 bg-gray-100 rounded-lg animate-pulse" />
                )}
                <div className="w-24 mt-2 text-neutral-400">
                  <AnimatedEndemitLogo />
                </div>
              </div>

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
                      className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                        order.hasEnoughBalance === false
                          ? "bg-red-100"
                          : "bg-gradient-to-br from-blue-500 to-purple-600"
                      }`}
                    >
                      {order.customerImage ? (
                        <Image
                          src={order.customerImage}
                          alt={
                            order.customerFirstName ||
                            order.customerName ||
                            "Customer"
                          }
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {(
                            order.customerFirstName ||
                            order.customerName ||
                            "?"
                          )
                            .split(" ")
                            .map(n => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {order.customerFirstName ||
                          order.customerName ||
                          "Customer"}{" "}
                        scanned
                      </p>
                      <p className="text-sm text-gray-600">
                        Balance:{" "}
                        {formatTokensFromCents(order.customerBalance || 0)}
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
                      {formatTokensFromCents(item.total)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Fallback sticker entry */}
              <button
                onClick={() => setSubView("sticker-scan")}
                className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 py-2"
              >
                Customer phone dead? Scan backup sticker →
              </button>
            </div>
          ) : subView === "sticker-scan" ? (
            <PosStickerScanView
              orderHash={order.orderHash}
              onScanned={handleStickerScanned}
              onBack={() => setSubView("qr")}
            />
          ) : subView === "customer-confirm" && stickerScan ? (
            <div className="relative -mx-6 -my-6 px-6 py-6 bg-neutral-900 text-white rounded-b-2xl">
              <button
                onClick={() => setIsRotated(r => !r)}
                title="Toggle rotation"
                className="absolute top-3 right-3 z-20 p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
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
                    d="M4 4v5h5M20 20v-5h-5M4 20a9 9 0 0015-6.7M20 4a9 9 0 00-15 6.7"
                  />
                </svg>
              </button>
              <PaymentConfirmView
                order={stickerScan.order}
                customer={stickerScan.customer}
                isRotated={isRotated}
                allowCustomTip={!isRotated}
                isProcessing={isPaying}
                error={payError}
                onPay={handlePay}
                onCancel={() => {
                  setSubView("qr");
                  setStickerScan(null);
                  setPayError(null);
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {!isPaid && subView === "qr" && (
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
              Continue
            </button>
            {autoCloseCountdown !== null && autoCloseCountdown > 0 && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Closing in {autoCloseCountdown}s
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
