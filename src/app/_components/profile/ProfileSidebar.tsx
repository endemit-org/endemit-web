"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import TicketOutlineIcon from "@/app/_components/icon/TicketOutlineIcon";
import LogoutIcon from "@/app/_components/icon/LogoutIcon";
import TopUpModal from "@/app/_components/profile/TopUpModal";

// Dynamic import: QR Scanner (~120KB) only loads when Pay Scanner is opened
const WalletPayScanner = dynamic(
  () =>
    import("@/app/_components/wallet/WalletPayScanner").then(mod => ({
      default: mod.WalletPayScanner,
    })),
  { ssr: false }
);
import type { Product } from "@/domain/product/types/product";
import { isEndemitPayEnabled } from "@/domain/wallet/businessRules";
import ActionButton from "@/app/_components/form/ActionButton";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import { useWalletAnimation } from "@/app/_components/wallet/WalletCoinAnimation";
import AnimatedBalance from "@/app/_components/wallet/AnimatedBalance";
import WalletAnimationRenderer from "@/app/_components/wallet/WalletAnimationRenderer";
import BackupStickerInline from "@/app/_components/profile/BackupStickerInline";
import { OPEN_TOP_UP_EVENT } from "@/app/_components/profile/topUpEvent";

// Send/receive modals are behind the collapsed "advanced" section — load lazily.
const SendFundsModal = dynamic(
  () => import("@/app/_components/wallet/SendFundsModal"),
  { ssr: false }
);
const ReceiveFundsModal = dynamic(
  () => import("@/app/_components/profile/ReceiveFundsModal"),
  { ssr: false }
);

interface ProfileSidebarProps {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  walletBalance: number | null;
  currencyProducts: Product[];
  upcomingTickets: number | null;
  isDonor?: boolean;
  backupStickerCode?: string | null;
  receiveCode: string;
}

export default function ProfileSidebar({
  userId,
  name,
  email,
  image,
  walletBalance: initialWalletBalance,
  upcomingTickets,
  currencyProducts,
  isDonor,
  backupStickerCode = null,
  receiveCode,
}: ProfileSidebarProps) {
  const t = useTranslations("profile");
  const router = useRouter();
  const [isPayScannerOpen, setIsPayScannerOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const walletRef = useRef<HTMLAnchorElement>(null);
  const prevBalanceRef = useRef(initialWalletBalance);
  const pendingUpdateRef = useRef<{
    direction: "in" | "out";
    balance: number;
  } | null>(null);
  const {
    animations,
    showGlow,
    glowDirection,
    triggerAnimation,
    removeAnimation,
  } = useWalletAnimation();

  // Check if any modal is open
  const isModalOpen =
    isPayScannerOpen ||
    isTopUpOpen ||
    showLogoutConfirm ||
    isSendOpen ||
    isReceiveOpen;

  // Trigger pending animation and balance update when modals close
  useEffect(() => {
    if (!isModalOpen && pendingUpdateRef.current) {
      const { direction, balance } = pendingUpdateRef.current;
      pendingUpdateRef.current = null;
      // Small delay for modal close animation
      setTimeout(() => {
        setWalletBalance(balance);
        triggerAnimation(direction, walletRef.current);
      }, 100);
    }
  }, [isModalOpen, triggerAnimation]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handlePaymentComplete = useCallback(() => {
    router.refresh();
  }, [router]);

  // The wristband-link modal asks us to open the top-up flow after it closes.
  useEffect(() => {
    const openTopUp = () => setIsTopUpOpen(true);
    window.addEventListener(OPEN_TOP_UP_EVENT, openTopUp);
    return () => window.removeEventListener(OPEN_TOP_UP_EVENT, openTopUp);
  }, []);

  // Subscribe to wallet transaction updates for real-time balance
  const handleWalletUpdate = useCallback(
    (payload: { balanceAfter: number }) => {
      const prevBalance = prevBalanceRef.current ?? 0;
      const newBalance = payload.balanceAfter;

      // Always update the ref to track latest balance
      prevBalanceRef.current = newBalance;

      // Determine animation direction
      const direction =
        newBalance > prevBalance
          ? "in"
          : newBalance < prevBalance
            ? "out"
            : null;

      if (direction) {
        if (isModalOpen) {
          // Store pending update to trigger when modal closes
          pendingUpdateRef.current = { direction, balance: newBalance };
        } else {
          // Trigger immediately
          setWalletBalance(newBalance);
          triggerAnimation(direction, walletRef.current);
        }
      } else {
        // No animation needed, just update balance
        setWalletBalance(newBalance);
      }
    },
    [triggerAnimation, isModalOpen]
  );

  useRealtimeChannel({
    channelName: `user:${userId}`,
    event: "wallet_transaction_created",
    onMessage: handleWalletUpdate,
  });
  const displayName = name || email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-neutral-950 rounded-lg p-6">
      {/* Avatar and Name */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative w-24 h-24 mb-4">
          {image ? (
            <Image
              src={image}
              alt={displayName}
              fill
              className="object-cover rounded-full"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          {isDonor && (
            <div className="z-10 absolute left-1/2 -translate-x-1/2 bottom-0 inline-flex items-center gap-1.5 px-3 py-0.5 bg-gradient-to-r from-yellow-900/50 to-amber-800/30 border border-yellow-600/50 rounded-full whitespace-nowrap">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M3 16 L4 7 L7 10 L10 5 L13 10 L16 7 L17 16 H3 Z" />
              </svg>
              <span className="text-xs font-medium text-yellow-300">
                {t("sidebar.donor")}
              </span>
            </div>
          )}
        </div>
        <h2 className="text-xl font-semibold text-neutral-200 mb-1">
          {displayName}
        </h2>
        <p className="text-sm text-neutral-400">{email}</p>

        <div className="mt-3 flex items-center justify-center gap-4">
          <Link
            href="/profile/edit"
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            {t("nav.editProfile")}
          </Link>
          <span className="text-neutral-600">|</span>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-sm text-neutral-400 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
            {t("sidebar.signOut")}
          </button>
        </div>
      </div>

      {/* Wallet Balance */}
      {walletBalance !== null && (
        <div className="mb-6">
          <WalletAnimationRenderer
            animations={animations}
            showGlow={showGlow}
            glowDirection={glowDirection}
            onAnimationComplete={removeAnimation}
          >
            <Link
              ref={walletRef}
              href="/profile/transactions"
              className="block p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 hover:border-blue-500/70 rounded-lg text-center relative overflow-hidden transition-colors"
            >
              <div
                className="absolute h-full opacity-10 inset w-full top-0 left-0"
                style={{
                  background:
                    "url('/images/noise.gif') no-repeat center center",
                  backgroundSize: "400px",
                  backgroundRepeat: "repeat",
                }}
              ></div>
              <div className="relative z-10 text-center">
                <div className="text-xs text-blue-300 mb-1">
                  {t("sidebar.walletBalance")}
                </div>
                <AnimatedBalance
                  value={walletBalance}
                  className={`text-2xl font-bold ${
                    walletBalance > 0
                      ? "text-green-400"
                      : walletBalance < 0
                        ? "text-red-400"
                        : "text-neutral-300"
                  }`}
                />
              </div>
            </Link>
          </WalletAnimationRenderer>
          {backupStickerCode && (
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              />
              {t("sidebar.wristbandLinked", { code: backupStickerCode })}
            </div>
          )}
        </div>
      )}

      {walletBalance !== null && (
        <BackupStickerInline
          currentCode={backupStickerCode}
          walletBalance={walletBalance}
          receiveCode={receiveCode}
        />
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <>
          <ActionButton
            onClick={() => setIsTopUpOpen(true)}
            // With an empty wallet, topping up is the main thing to do here.
            variant={(walletBalance ?? 0) <= 0 ? "primary" : "secondary"}
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
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {t("sidebar.topUpWallet")}
          </ActionButton>

          {/* Muted for now: customers scanning the register's order QR is a
              second payment flow — we want one flow (register scans the
              customer) to work first, without confusing users. Re-enable by
              restoring this button. */}
          {false && isEndemitPayEnabled() && (
            <button
              type="button"
              onClick={() => setIsPayScannerOpen(true)}
              className="w-full text-center text-xs text-neutral-500 hover:text-neutral-300 py-1 transition-colors"
            >
              {t("sidebar.scanPosOrder")}
            </button>
          )}
        </>
        {!!upcomingTickets && (
          <Link
            href="/profile/tickets"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-medium rounded-lg transition-colors"
          >
            <TicketOutlineIcon className="w-5 h-5" />
            {t("sidebar.viewTickets")}
          </Link>
        )}
      </div>

      {/* Advanced options — rarely-needed extras, collapsed by default */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(v => !v)}
          aria-expanded={isAdvancedOpen}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 py-1 transition-colors"
        >
          {t("sidebar.advancedOptions")}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isAdvancedOpen && (
          <div className="mt-2">
            <p className="text-xs text-neutral-500 text-center mb-3">
              {t("sidebar.exchangeDesc")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsSendOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 17L17 7m0 0H9m8 0v8"
                  />
                </svg>
                {t("sidebar.sendTokens")}
              </button>
              <button
                type="button"
                onClick={() => setIsReceiveOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 7L7 17m0 0h8m-8 0V9"
                  />
                </svg>
                {t("sidebar.receiveTokens")}
              </button>
            </div>
          </div>
        )}
      </div>

      <SendFundsModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        senderBalance={walletBalance ?? 0}
      />
      <ReceiveFundsModal
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        receiveCode={receiveCode}
      />

      {!isEndemitPayEnabled() && (
        <div className="mt-6 text-center text-sm text-neutral-400">
          {t("sidebar.endePayNotice")}
        </div>
      )}

      {/* Scan to Pay Modal */}
      {isEndemitPayEnabled() && (
        <WalletPayScanner
          isOpen={isPayScannerOpen}
          onClose={() => setIsPayScannerOpen(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Top Up Modal */}

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        products={currencyProducts}
        balance={walletBalance}
      />

      {/* Logout Confirmation Modal - rendered via portal */}
      {showLogoutConfirm &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="bg-neutral-900 rounded-xl p-6 max-w-sm w-full mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-neutral-200 mb-2">
                {t("sidebar.signOut")}
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                {t("sidebar.signOutConfirmMessage")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-200 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t("sidebar.cancel")}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoggingOut
                    ? t("sidebar.signingOut")
                    : t("sidebar.signOut")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
