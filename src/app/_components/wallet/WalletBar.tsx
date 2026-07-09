"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import ActionButton from "@/app/_components/form/ActionButton";
import { fetchMyWalletAction } from "@/domain/wallet/actions/fetchMyWalletAction";
import { formatTokensFromCents } from "@/lib/util/currency";

interface Props {
  /** Fetch lazily: the balance loads the first time this turns true
      (menu opened), not on every page load. */
  active: boolean;
  /** Called when the user navigates to the wallet (closes the menu). */
  onNavigate?: () => void;
}

/**
 * Mobile-menu wallet strip, the checkout bar's sibling: shown only when the
 * signed-in visitor has a positive token balance, links to the profile
 * wallet.
 */
export default function WalletBar({ active, onNavigate }: Props) {
  const t = useTranslations("profile.sidebar");
  const tPay = useTranslations("profile.walletPay");
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!active || fetchedRef.current) return;
    fetchedRef.current = true;
    fetchMyWalletAction()
      .then(wallet => setBalance(wallet?.balance ?? 0))
      .catch(() => setBalance(0));
  }, [active]);

  if (!balance || balance <= 0) return null;

  // Straight into the pay QR modal on the profile (see BackupStickerInline).
  const openPay = () => {
    onNavigate?.();
    router.push("/profile?pay=1");
  };

  return (
    <div className="flex items-center gap-3 bg-neutral-800 px-5 py-3 text-white">
      <Link
        href="/profile?pay=1"
        onClick={onNavigate}
        className="flex flex-1 min-w-0 items-center gap-3"
      >
        {/* Same QR glyph as the profile's Pay button. */}
        <svg
          className="w-6 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4h4v4H4V4zm0 8h4v4H4v-4zm0 8h4v-4h4v4H8v-4H4v4zm8-16h4v4h-4V4zm0 8h4v4h-4v-4zm0 8h4v-4h4v4h-4v-4h-4v4zm8-16h-4v4h4V4zm0 8h-4v4h4v-4z"
          />
        </svg>
        <div className="leading-tight">
          <div className="text-2xl font-heading">
            {formatTokensFromCents(balance)}
          </div>
          <div className="text-xs text-neutral-400 -mt-1">
            {t("walletBalance")}
          </div>
        </div>
      </Link>
      <ActionButton
        onClick={openPay}
        size="sm"
        variant="primary"
        fullWidth={false}
      >
        {tPay("pay")}
      </ActionButton>
    </div>
  );
}
