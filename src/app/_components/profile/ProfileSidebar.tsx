"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/util/formatting";
import TicketOutlineIcon from "@/app/_components/icon/TicketOutlineIcon";
import { WalletPayScanner } from "@/app/_components/wallet/WalletPayScanner";
import TopUpModal from "@/app/_components/profile/TopUpModal";
import type { Product } from "@/domain/product/types/product";
import { isEndemitPayEnabled } from "@/domain/wallet/businessRules";
import ActionButton from "@/app/_components/form/ActionButton";

interface ProfileSidebarProps {
  name: string | null;
  email: string;
  image: string | null;
  walletBalance: number | null;
  currencyProducts: Product[];
  upcomingTickets: number | null;
}

export default function ProfileSidebar({
  name,
  email,
  image,
  walletBalance,
  upcomingTickets,
  currencyProducts,
}: ProfileSidebarProps) {
  const router = useRouter();
  const [isPayScannerOpen, setIsPayScannerOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const handlePaymentComplete = useCallback(() => {
    router.refresh();
  }, [router]);
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
        <Link
          href="/profile/edit"
          className="mt-3 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
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
      </div>

      {/* Wallet Balance */}
      {walletBalance !== null && (
        <div className="mb-6 p-4 bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/50 rounded-lg text-center relative overflow-hidden">
          <div
            className="absolute  h-full opacity-10 inset w-full top-0 left-0"
            style={{
              background: "url('/images/noise.gif') no-repeat center center",
              backgroundSize: "400px",
              backgroundRepeat: "repeat",
            }}
          ></div>
          <div className={"relative z-10"}>
            <div className="text-xs text-blue-300 mb-1">Wallet Balance</div>
            <div
              className={`text-2xl font-bold ${
                walletBalance > 0
                  ? "text-green-400"
                  : walletBalance < 0
                    ? "text-red-400"
                    : "text-neutral-300"
              }`}
            >
              {formatCurrency(walletBalance / 100)}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <>
          <ActionButton
            onClick={() => setIsPayScannerOpen(true)}
            disabled={!isEndemitPayEnabled()}
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
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            Scan Endemit Pay
          </ActionButton>

          <ActionButton
            onClick={() => setIsTopUpOpen(true)}
            disabled={!isEndemitPayEnabled()}
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
        {upcomingTickets && (
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
          Endemit Pay drives our cashless payments, it will be re-enabled before
          the festival in August.
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
      {isEndemitPayEnabled() && (
        <TopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          products={currencyProducts}
        />
      )}
    </div>
  );
}
