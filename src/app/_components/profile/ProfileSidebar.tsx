"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TicketOutlineIcon from "@/app/_components/icon/TicketOutlineIcon";
import LogoutIcon from "@/app/_components/icon/LogoutIcon";
import TopUpModal from "@/app/_components/profile/TopUpModal";

// Dynamic import: QR Scanner (~120KB) only loads when Pay Scanner is opened
const WalletPayScanner = dynamic(
  () => import("@/app/_components/wallet/WalletPayScanner").then(mod => ({ default: mod.WalletPayScanner })),
  { ssr: false }
);
import type { Product } from "@/domain/product/types/product";
import { isEndemitPayEnabled } from "@/domain/wallet/businessRules";
import ActionButton from "@/app/_components/form/ActionButton";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";
import { useWalletAnimation } from "@/app/_components/wallet/WalletCoinAnimation";
import AnimatedBalance from "@/app/_components/wallet/AnimatedBalance";
import WalletAnimationRenderer from "@/app/_components/wallet/WalletAnimationRenderer";

interface ProfileSidebarProps {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  walletBalance: number | null;
  currencyProducts: Product[];
  upcomingTickets: number | null;
  isDonor?: boolean;
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
}: ProfileSidebarProps) {
  const router = useRouter();
  const [isPayScannerOpen, setIsPayScannerOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(initialWalletBalance);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const walletRef = useRef<HTMLDivElement>(null);
  const prevBalanceRef = useRef(initialWalletBalance);
  const pendingUpdateRef = useRef<{ direction: "in" | "out"; balance: number } | null>(null);
  const { animations, showGlow, glowDirection, triggerAnimation, removeAnimation } =
    useWalletAnimation();

  // Check if any modal is open
  const isModalOpen = isPayScannerOpen || isTopUpOpen || showLogoutConfirm;

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

  // Subscribe to wallet transaction updates for real-time balance
  const handleWalletUpdate = useCallback(
    (payload: { balanceAfter: number }) => {
      const prevBalance = prevBalanceRef.current ?? 0;
      const newBalance = payload.balanceAfter;

      // Always update the ref to track latest balance
      prevBalanceRef.current = newBalance;

      // Determine animation direction
      const direction = newBalance > prevBalance ? "in" : newBalance < prevBalance ? "out" : null;

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
        </div>
        <h2 className="text-xl font-semibold text-neutral-200 mb-1">
          {displayName}
        </h2>
        <p className="text-sm text-neutral-400">{email}</p>
        {isDonor && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-900/50 to-amber-800/30 border border-yellow-600/50 rounded-full">
            <svg
              className="w-4 h-4 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L10 6.477V16h2a1 1 0 110 2H8a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium text-yellow-300">Donor</span>
          </div>
        )}
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
            Edit Profile
          </Link>
          <span className="text-neutral-600">|</span>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="text-sm text-neutral-400 hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <LogoutIcon className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Wallet Balance */}
      {walletBalance !== null && (
        <WalletAnimationRenderer
          animations={animations}
          showGlow={showGlow}
          glowDirection={glowDirection}
          onAnimationComplete={removeAnimation}
        >
          <div
            ref={walletRef}
            className="mb-6 p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 rounded-lg text-center relative overflow-hidden"
          >
            <div
              className="absolute h-full opacity-10 inset w-full top-0 left-0"
              style={{
                background: "url('/images/noise.gif') no-repeat center center",
                backgroundSize: "400px",
                backgroundRepeat: "repeat",
              }}
            ></div>
            <div className="relative z-10 text-center">
              <div className="text-xs text-blue-300 mb-1">Wallet Balance</div>
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
          </div>
        </WalletAnimationRenderer>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <>
          <ActionButton
            onClick={() => setIsPayScannerOpen(true)}
            disabled={!isEndemitPayEnabled()}
          >
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Scan EndePay
          </ActionButton>

          <ActionButton
            onClick={() => setIsTopUpOpen(true)}
            variant={"secondary"}
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
            Top Up Wallet
          </ActionButton>
        </>
        {!!upcomingTickets && (
          <Link
            href="/profile/tickets"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 font-medium rounded-lg transition-colors"
          >
            <TicketOutlineIcon className="w-5 h-5" />
            View Tickets
          </Link>
        )}
      </div>

      {!isEndemitPayEnabled() && (
        <div className="mt-6 text-center text-sm text-neutral-400">
          EndePay drives our cashless payments, it will be re-enabled before the
          festival in August.
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
                Sign Out
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-200 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
