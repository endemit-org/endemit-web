"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { addWalletCreditAction } from "@/domain/wallet/actions/addWalletCreditAction";
import { debitWalletAction } from "@/domain/wallet/actions/debitWalletAction";
import { formatTokensFromCents, TOKEN_CONFIG } from "@/lib/util/currency";

interface WalletTransactionFormProps {
  walletId: string;
  currentBalance: number;
}

type Direction = "credit" | "debit";

export default function WalletTransactionForm({
  walletId,
  currentBalance,
}: WalletTransactionFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.wallets");
  const [direction, setDirection] = useState<Direction>("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [subject, setSubject] = useState("");
  // Until the admin edits the subject it tracks the per-direction preset
  const [subjectTouched, setSubjectTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const presetSubject = (dir: Direction) =>
    dir === "credit" ? t("emailSubjectPresetAdd") : t("emailSubjectPresetRemove");

  const effectiveSubject = subjectTouched ? subject : presetSubject(direction);

  const handleDirectionChange = (dir: Direction) => {
    setDirection(dir);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountCents) || amountCents <= 0) {
      setError(t("errorInvalidAmount"));
      return;
    }

    if (direction === "debit" && amountCents > currentBalance) {
      setError(
        t("errorDebitExceeds", {
          balance: formatTokensFromCents(currentBalance),
        })
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const input = {
        walletId,
        amount: amountCents,
        note: note || undefined,
        sendEmail,
        emailSubject: sendEmail ? effectiveSubject : undefined,
      };

      if (direction === "credit") {
        await addWalletCreditAction(input);
        setSuccess(
          t("successAdded", { amount: formatTokensFromCents(amountCents) })
        );
      } else {
        await debitWalletAction(input);
        setSuccess(
          t("successRemoved", { amount: formatTokensFromCents(amountCents) })
        );
      }

      setAmount("");
      setNote("");
      setSubject("");
      setSubjectTouched(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const directionButtonClass = (dir: Direction) =>
    `flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      direction === dir
        ? dir === "credit"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
        : "bg-white text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("directionLabel")}
        </label>
        <div className="inline-flex w-full sm:w-auto gap-1 p-1 border border-gray-300 rounded-lg bg-gray-100">
          <button
            type="button"
            onClick={() => handleDirectionChange("credit")}
            className={directionButtonClass("credit")}
          >
            {t("directionAdd")}
          </button>
          <button
            type="button"
            onClick={() => handleDirectionChange("debit")}
            disabled={currentBalance === 0}
            className={`${directionButtonClass("debit")} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t("directionRemove")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("amountLabel", { symbol: TOKEN_CONFIG.symbol })}
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="0.00"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
        <div>
          <label
            htmlFor="note"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("noteLabel")}
          </label>
          <input
            type="text"
            id="note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t("notePlaceholder")}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="send-adjustment-email"
          checked={sendEmail}
          onChange={e => setSendEmail(e.target.checked)}
          disabled={isSubmitting}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="send-adjustment-email" className="text-sm text-gray-700">
          {t("sendEmailLabel")}
        </label>
      </div>

      {sendEmail && (
        <div>
          <label
            htmlFor="email-subject"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("emailSubjectLabel")}
          </label>
          <input
            type="text"
            id="email-subject"
            value={effectiveSubject}
            onChange={e => {
              setSubject(e.target.value);
              setSubjectTouched(true);
            }}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">{t("emailSubjectHint")}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !amount || (sendEmail && !effectiveSubject.trim())}
        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          direction === "credit"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isSubmitting
          ? t("processing")
          : direction === "credit"
            ? t("addCredit")
            : t("removeFunds")}
      </button>
    </form>
  );
}
