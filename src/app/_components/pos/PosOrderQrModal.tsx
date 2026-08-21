"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import AnimatedEndemitLogo from "@/app/_components/icon/AnimatedEndemitLogo";
import { formatTokensFromCents } from "@/lib/util/currency";
import Image from "next/image";
import { type StickerScanResult } from "./PosStickerScanView";
import { PaymentConfirmView } from "@/app/_components/payment/PaymentConfirmView";
import { PosMethodConfirmView } from "./PosMethodConfirmView";
import AnimatedBalance from "@/app/_components/wallet/AnimatedBalance";
import WalletAnimationRenderer from "@/app/_components/wallet/WalletAnimationRenderer";
import { useWalletAnimation } from "@/app/_components/wallet/WalletCoinAnimation";
import { posErrorMessageKey } from "@/domain/pos/types/posError";

// Dynamic import: QR Scanner (~120KB) only loads when sticker scan view is opened
const PosStickerScanView = dynamic(
  () =>
    import("./PosStickerScanView").then(mod => ({
      default: mod.PosStickerScanView,
    })),
  { ssr: false }
);

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
    direction?: "CREDIT" | "DEBIT";
    isTicket?: boolean;
  }>;
  customerName?: string;
  customerFirstName?: string | null;
  customerImage?: string | null;
  customerBalance?: number;
  hasEnoughBalance?: boolean;
  tipAmount?: number;
  paymentMethod?: "WALLET" | "CASH" | "CARD";
  paidAt?: string;
}

interface RegisterConfig {
  acceptsWallet: boolean;
  acceptsCash: boolean;
  acceptsCard: boolean;
}

interface Props {
  order: PosOrderSummary;
  register: RegisterConfig;
  onClose: () => void;
  onCopyToCart: () => void;
}

const AUTO_CLOSE_SECONDS = 30;

type SubView =
  | "qr"
  | "sticker-scan"
  | "customer-confirm"
  | "method-select"
  | "cash-confirm"
  | "card-confirm";

export function PosOrderQrModal({
  order,
  register,
  onClose,
  onCopyToCart,
}: Props) {
  const t = useTranslations("pos");
  const tw = useTranslations("profile.walletPay");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(
    null
  );
  // Top-up orders always scan first (wallet to credit); sales go straight
  // into their single enabled method, or to the method chooser.
  const hasTopUpItems = order.items.some(i => i.direction === "CREDIT");
  const hasTicketItems = order.items.some(i => i.isTicket);
  const saleMethods: Array<"WALLET" | "CASH" | "CARD"> = [
    ...(register.acceptsWallet ? (["WALLET"] as const) : []),
    ...(register.acceptsCash ? (["CASH"] as const) : []),
    ...(register.acceptsCard ? (["CARD"] as const) : []),
  ];
  const fundingMethods: Array<"CASH" | "CARD"> = [
    ...(register.acceptsCash ? (["CASH"] as const) : []),
    ...(register.acceptsCard ? (["CARD"] as const) : []),
  ];

  const initialSubView = (): SubView => {
    if (hasTopUpItems) return "sticker-scan";
    if (saleMethods.length === 1) {
      if (saleMethods[0] === "WALLET") return "sticker-scan";
      return saleMethods[0] === "CASH" ? "cash-confirm" : "card-confirm";
    }
    return "method-select";
  };

  const [subView, setSubView] = useState<SubView>(initialSubView);
  const [stickerScan, setStickerScan] = useState<StickerScanResult | null>(
    null
  );
  const [isRotated, setIsRotated] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const totalRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const totalAnim = useWalletAnimation();
  const tipAnim = useWalletAnimation();
  const triggerTotalAnimation = totalAnim.triggerAnimation;
  const triggerTipAnimation = tipAnim.triggerAnimation;
  const hasTriggeredCoinsRef = useRef(false);

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
  const fireConfetti = useCallback(async () => {
    // Dynamic import: canvas-confetti (~33KB) only loads when tip is received
    const confetti = (await import("canvas-confetti")).default;
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

  useEffect(() => {
    if (!isPaid || hasTriggeredCoinsRef.current) return;
    hasTriggeredCoinsRef.current = true;

    const totalTimer = setTimeout(() => {
      triggerTotalAnimation("in", totalRef.current);
    }, 60);

    let tipTimer: ReturnType<typeof setTimeout> | undefined;
    if (hasTip) {
      tipTimer = setTimeout(() => {
        triggerTipAnimation("in", tipRef.current);
      }, 280);
    }

    return () => {
      clearTimeout(totalTimer);
      if (tipTimer) clearTimeout(tipTimer);
    };
  }, [isPaid, hasTip, triggerTotalAnimation, triggerTipAnimation]);

  // Reset sub-view state when the order becomes paid
  useEffect(() => {
    if (isPaid) {
      setSubView("sticker-scan");
      setStickerScan(null);
      setPayError(null);
    }
  }, [isPaid]);

  // Mid-payment the cross asks for confirmation instead of closing outright
  const handleCloseRequest = useCallback(() => {
    if (isPaying) return;
    const inPaymentStep =
      (subView === "customer-confirm" && stickerScan) ||
      subView === "cash-confirm" ||
      subView === "card-confirm";
    if (!isPaid && inPaymentStep) {
      setShowCancelConfirm(true);
      return;
    }
    onClose();
  }, [isPaying, isPaid, subView, stickerScan, onClose]);

  const handleStickerScanned = useCallback(
    (result: StickerScanResult) => {
      setStickerScan(result);
      setPayError(null);
      if (hasTopUpItems) {
        // Wallet identified — now pick the physical tender funding the top-up
        if (fundingMethods.length === 1) {
          setSubView(
            fundingMethods[0] === "CASH" ? "cash-confirm" : "card-confirm"
          );
        } else {
          setSubView("method-select");
        }
      } else {
        setSubView("customer-confirm");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasTopUpItems, register.acceptsCash, register.acceptsCard]
  );

  const handleMarkPaid = useCallback(
    async (method: "CASH" | "CARD", tipAmount: number, buyerEmail?: string) => {
      if (isPaying) return;
      setIsPaying(true);
      setPayError(null);
      try {
        const response = await fetch(
          `/api/v1/pos/orders/${order.orderHash}/mark-paid`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method, tipAmount, buyerEmail }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          const key = posErrorMessageKey(data.errorCode);
          throw new Error(key ? tw(`errors.${key}`) : tw("paymentFailed"));
        }
        // The pos_order_paid broadcast flips the modal to the paid screen
      } catch (err) {
        setPayError(err instanceof Error ? err.message : tw("paymentFailed"));
      } finally {
        setIsPaying(false);
      }
    },
    [order.orderHash, isPaying, tw]
  );

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
          const key = posErrorMessageKey(data.errorCode);
          throw new Error(key ? tw(`errors.${key}`) : tw("paymentFailed"));
        }
      } catch (err) {
        setPayError(err instanceof Error ? err.message : tw("paymentFailed"));
      } finally {
        setIsPaying(false);
      }
    },
    [stickerScan, isPaying, tw]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`relative rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-colors duration-300 ${
          isPaid
            ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white"
            : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isPaid ? "border-white/20" : ""
          }`}
        >
          <div className="text-xl text-center w-full">
            {t.rich("orders.yourTotalIs", {
              amount: formatTokensFromCents(order.total),
              bold: chunks => <span className="font-bold">{chunks}</span>,
            })}
          </div>

          <button
            onClick={handleCloseRequest}
            className={`p-2 rounded-full ${
              isPaid ? "hover:bg-white/10 text-white" : "hover:bg-gray-100"
            }`}
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
            <div className="text-center py-3">
              {/* Customer-facing (screen turned toward them): new balance,
                  rotated 180° so it reads upright from the other side. */}
              {order.customerBalance != null && (
                <div className="rotate-180 mb-3 pt-3 border-t border-white/20">
                  <span className="block text-5xl font-bold leading-none text-white">
                    <AnimatedBalance
                      value={order.customerBalance}
                      countFromZero
                    />
                  </span>
                  <p className="text-xs uppercase tracking-widest text-white/70 mt-2">
                    {t("orders.newBalance")}
                  </p>
                </div>
              )}
              <div className="w-14 h-14 mx-auto rounded-full bg-white flex items-center justify-center mb-2 shadow-lg">
                <svg
                  className="w-7 h-7 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-1">
                {t("orders.paymentReceived")}
              </h3>
              {order.paymentMethod && (
                <p className="text-xs uppercase tracking-widest text-white/70 mb-3">
                  {order.paymentMethod === "WALLET"
                    ? t("methods.wallet")
                    : order.paymentMethod === "CASH"
                      ? t("methods.cash")
                      : t("methods.card")}
                </p>
              )}
              {hasTip ? (
                <div className="flex items-end justify-center gap-4">
                  <div className="text-center">
                    <WalletAnimationRenderer
                      animations={totalAnim.animations}
                      showGlow={totalAnim.showGlow}
                      glowDirection={totalAnim.glowDirection}
                      onAnimationComplete={totalAnim.removeAnimation}
                    >
                      <span
                        ref={totalRef}
                        className="block text-3xl font-bold leading-none text-white"
                      >
                        <AnimatedBalance value={order.total} countFromZero />
                      </span>
                    </WalletAnimationRenderer>
                    <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1">
                      {t("orders.total")}
                    </p>
                  </div>
                  <div className="text-2xl text-white/50 pb-1 leading-none font-semibold">
                    +
                  </div>
                  <div className="text-center">
                    <WalletAnimationRenderer
                      animations={tipAnim.animations}
                      showGlow={tipAnim.showGlow}
                      glowDirection={tipAnim.glowDirection}
                      onAnimationComplete={tipAnim.removeAnimation}
                    >
                      <span
                        ref={tipRef}
                        className="inline-flex items-baseline gap-1 text-xl font-semibold text-yellow-200 leading-none"
                      >
                        <AnimatedBalance
                          value={order.tipAmount!}
                          countFromZero
                        />
                        <span aria-hidden>✨</span>
                      </span>
                    </WalletAnimationRenderer>
                    <p className="text-[10px] uppercase tracking-widest text-yellow-200/80 mt-1">
                      {t("orders.tip")}
                    </p>
                  </div>
                </div>
              ) : (
                <WalletAnimationRenderer
                  animations={totalAnim.animations}
                  showGlow={totalAnim.showGlow}
                  glowDirection={totalAnim.glowDirection}
                  onAnimationComplete={totalAnim.removeAnimation}
                >
                  <span
                    ref={totalRef}
                    className="block text-3xl font-bold leading-none text-white"
                  >
                    <AnimatedBalance value={order.total} countFromZero />
                  </span>
                </WalletAnimationRenderer>
              )}
            </div>
          ) : subView === "qr" ? (
            <div>
              {/* Large Short Code */}
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">
                  {t("orders.orderCode")}
                </p>
                <p className="text-5xl font-mono font-bold tracking-[0.3em] text-gray-900">
                  {order.shortCode}
                </p>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center mb-4">
                {qrDataUrl ? (
                  <Image
                    src={qrDataUrl}
                    alt={t("orders.qrAlt")}
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
                            t("orders.customer")
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
                        {t("orders.customerScanned", {
                          name:
                            order.customerFirstName ||
                            order.customerName ||
                            t("orders.customer"),
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t("orders.balanceLabel")}:{" "}
                        {formatTokensFromCents(order.customerBalance || 0)}
                        {order.hasEnoughBalance === false && (
                          <span className="text-red-600 ml-1">
                            {t("orders.insufficient")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 mb-4">
                  {t("orders.waitingForScan")}
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
            </div>
          ) : subView === "method-select" ? (
            <div className="py-2">
              <p className="text-center text-sm text-gray-500 mb-4">
                {t("methods.selectPrompt")}
              </p>
              <div className="space-y-3">
                {!hasTopUpItems && register.acceptsWallet && (
                  <button
                    onClick={() => setSubView("sticker-scan")}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold"
                  >
                    <span className="text-2xl">📱</span>
                    {t("methods.wallet")}
                  </button>
                )}
                {register.acceptsCash && (
                  <button
                    onClick={() => setSubView("cash-confirm")}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold"
                  >
                    <span className="text-2xl">💶</span>
                    {t("methods.cash")}
                  </button>
                )}
                {register.acceptsCard && (
                  <button
                    onClick={() => setSubView("card-confirm")}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold"
                  >
                    <span className="text-2xl">💳</span>
                    {t("methods.card")}
                  </button>
                )}
              </div>
            </div>
          ) : subView === "cash-confirm" || subView === "card-confirm" ? (
            <PosMethodConfirmView
              method={subView === "cash-confirm" ? "CASH" : "CARD"}
              items={order.items}
              subtotal={order.subtotal}
              showEmailField={hasTicketItems}
              isRotated={isRotated}
              onToggleRotation={() => setIsRotated(r => !r)}
              isProcessing={isPaying}
              error={payError}
              onConfirm={(tipAmount, buyerEmail) =>
                handleMarkPaid(
                  subView === "cash-confirm" ? "CASH" : "CARD",
                  tipAmount,
                  buyerEmail
                )
              }
              onBack={() => {
                setPayError(null);
                const choices = hasTopUpItems
                  ? fundingMethods.length
                  : saleMethods.length;
                if (choices > 1) setSubView("method-select");
                else onClose();
              }}
            />
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
                title={t("orders.toggleRotation")}
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
                isProcessing={isPaying}
                error={payError}
                onPay={handlePay}
              />
            </div>
          ) : null}
        </div>

        {/* Actions */}
        {!isPaid && (subView === "sticker-scan" || subView === "method-select") && (
          <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
            {/* Hidden for now — sticker scan is the only offered flow.
            <button
              onClick={() => setSubView("qr")}
              className="flex-1 px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50"
            >
              {t("orders.showQr")}
            </button>
            */}
            <button
              onClick={onCopyToCart}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {t("orders.cancelEdit")}
            </button>
          </div>
        )}

        {!isPaid && subView === "qr" && (
          <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={() => setSubView("sticker-scan")}
              className="flex-1 px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50"
            >
              {t("sticker.scanWristband")}
            </button>
            <button
              onClick={onCopyToCart}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {t("orders.cancelEdit")}
            </button>
          </div>
        )}

        {isPaid && (
          <div className="px-6 py-4 border-t border-white/20 space-y-2">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-white/90"
            >
              {t("orders.continue")}
            </button>
            <a
              href={`/pos/receipt/${order.orderHash}`}
              target="_blank"
              rel="noopener"
              className="block w-full px-4 py-2 text-center border border-white/40 text-white text-sm font-medium rounded-lg hover:bg-white/10"
            >
              {t("orders.printReceipt")}
            </a>
            {autoCloseCountdown !== null && autoCloseCountdown > 0 && (
              <p className="text-center text-sm text-white/70 mt-2">
                {t("orders.closingIn", { count: autoCloseCountdown })}
              </p>
            )}
          </div>
        )}

        {showCancelConfirm && (
          <div className="absolute inset-0 z-30 bg-black/70 flex items-center justify-center p-6 rounded-2xl">
            <div className="bg-white rounded-xl p-5 w-full max-w-xs shadow-xl">
              <p className="text-gray-900 font-medium text-center mb-4">
                {tw("cancelPaymentConfirm")}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  {tw("cancelPaymentNo")}
                </button>
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    onClose();
                  }}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                >
                  {tw("cancelPaymentYes")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
