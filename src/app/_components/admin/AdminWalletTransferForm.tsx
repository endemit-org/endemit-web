"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { adminTransferFundsAction } from "@/domain/wallet/actions/adminTransferFundsAction";
import type { UserSearchResult } from "@/domain/user/actions/searchUsersAction";
import UserAutocomplete from "./UserAutocomplete";
import { formatTokensFromCents, TOKEN_CONFIG } from "@/lib/util/currency";

interface AdminWalletTransferFormProps {
  senderUserId: string;
  currentBalance: number;
}

export default function AdminWalletTransferForm({
  senderUserId,
  currentBalance,
}: AdminWalletTransferFormProps) {
  const router = useRouter();
  const t = useTranslations("admin.wallets");
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipient, setRecipient] = useState<UserSearchResult | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // One key per form fill so a double-click or retry can't run the transfer twice
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(amount) * 100);

    if (isNaN(amountCents) || amountCents <= 0) {
      setError(t("errorInvalidAmount"));
      return;
    }
    if (!recipient) {
      setError(t("transferErrorNoRecipient"));
      return;
    }
    if (recipient.id === senderUserId) {
      setError(t("transferErrorSelf"));
      return;
    }
    if (amountCents > currentBalance) {
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
      await adminTransferFundsAction({
        senderUserId,
        recipientUserId: recipient.id,
        amount: amountCents,
        idempotencyKey: idempotencyKeyRef.current,
        note: note || undefined,
      });

      setSuccess(
        t("transferSuccess", {
          amount: formatTokensFromCents(amountCents),
          name: recipient.name || recipient.username,
        })
      );
      setAmount("");
      setNote("");
      setRecipient(null);
      setRecipientQuery("");
      idempotencyKeyRef.current = crypto.randomUUID();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {t("transferRecipientLabel")}
        </label>
        <UserAutocomplete
          value={recipientQuery}
          onChange={value => {
            setRecipientQuery(value);
            setRecipient(null);
          }}
          onUserSelect={setRecipient}
          placeholder={t("transferRecipientPlaceholder")}
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="transfer-amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("amountLabel", { symbol: TOKEN_CONFIG.symbol })}
          </label>
          <input
            type="number"
            id="transfer-amount"
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
            htmlFor="transfer-note"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {t("noteLabel")}
          </label>
          <input
            type="text"
            id="transfer-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t("notePlaceholder")}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !amount || !recipient}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? t("processing") : t("transferSubmit")}
      </button>
    </form>
  );
}
