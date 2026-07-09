"use client";

import { useTranslations } from "next-intl";
import type { AddToWalletButtonLabels } from "@/app/_components/ticket/AddToWalletButton";

// Localized labels for AddToWalletButton. Only usable inside a next-intl
// provider; unlocalized contexts (admin) rely on the button's English
// defaults instead.
export function useWalletPassLabels(): AddToWalletButtonLabels {
  const t = useTranslations("walletPass");
  return {
    addToWallet: t("addToWallet"),
    adding: t("adding"),
    warningTitle: t("warningTitle"),
    warningBody: t("warningBody"),
    cancel: t("cancel"),
    downloadAnyway: t("downloadAnyway"),
  };
}
