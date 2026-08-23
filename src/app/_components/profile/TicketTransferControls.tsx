"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  initiateTicketTransferAction,
  revokeTicketTransferAction,
} from "@/domain/ticket/actions/ticketTransferActions";

interface Props {
  ticketId: string;
  pendingTransfer: {
    id: string;
    recipientEmail: string;
    expiresAt: string;
  } | null;
}

/**
 * Transfer a ticket to a friend by email. Deliberately a plain input — no
 * autocomplete/member lookup, so existing emails are never disclosed.
 */
export default function TicketTransferControls({
  ticketId,
  pendingTransfer,
}: Props) {
  const t = useTranslations("profile.ticketTransfer");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.includes("@")) {
      setError(t("invalidEmail"));
      return;
    }
    setIsWorking(true);
    setError(null);
    const result = await initiateTicketTransferAction({
      ticketId,
      recipientEmail: email,
    });
    setIsWorking(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const handleRevoke = async () => {
    if (!pendingTransfer) return;
    setIsWorking(true);
    setError(null);
    const result = await revokeTicketTransferAction(pendingTransfer.id);
    setIsWorking(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  if (pendingTransfer) {
    return (
      <div className="max-w-lg mx-auto mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
        <p className="text-sm text-amber-300 mb-1">
          {t("pendingTo", { email: pendingTransfer.recipientEmail })}
        </p>
        <p className="text-xs text-neutral-500 mb-3">{t("pendingNote")}</p>
        {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
        <button
          onClick={handleRevoke}
          disabled={isWorking}
          className="px-4 py-2 text-sm font-medium text-red-400 border border-red-500/40 rounded-lg hover:bg-red-500/10 disabled:opacity-50"
        >
          {isWorking ? t("working") : t("revoke")}
        </button>
      </div>
    );
  }

  // Closed state: a bare link, no frame — the box appears once opened
  if (!isOpen) {
    return (
      <div className="max-w-lg mx-auto mt-6 text-center">
        <button
          onClick={() => setIsOpen(true)}
          className="text-sm font-medium text-blue-400 hover:text-blue-300 underline underline-offset-4"
        >
          {t("transferButton")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-6 bg-neutral-800/50 border border-neutral-700 rounded-lg p-4">
      <div className="space-y-3">
          <p className="text-sm text-neutral-300">{t("prompt")}</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            autoComplete="off"
            disabled={isWorking}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={isWorking || !email}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isWorking ? t("working") : t("send")}
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
              disabled={isWorking}
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200"
            >
              {t("cancel")}
            </button>
          </div>
          <p className="text-xs text-neutral-500">{t("hint")}</p>
      </div>
    </div>
  );
}
