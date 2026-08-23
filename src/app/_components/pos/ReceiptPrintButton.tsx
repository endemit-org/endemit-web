"use client";

import { useTranslations } from "next-intl";

/**
 * Explicit print button — iOS Safari only honors window.print() on a user
 * gesture, so no auto-print on load.
 */
export default function ReceiptPrintButton() {
  const t = useTranslations("pos.receipt");
  return (
    <button
      onClick={() => window.print()}
      className="no-print w-full px-4 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-700"
    >
      {t("printButton")}
    </button>
  );
}
