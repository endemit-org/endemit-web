"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  acceptTicketTransferAction,
  acceptIncomingTransferAction,
} from "@/domain/ticket/actions/ticketTransferActions";

interface Props {
  /** Accept via secure token (accept page) or transfer id (profile inbox). */
  token?: string;
  transferId?: string;
}

export default function TransferAcceptButton({ token, transferId }: Props) {
  const t = useTranslations("profile.ticketTransfer");
  const router = useRouter();
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsWorking(true);
    setError(null);
    const result = token
      ? await acceptTicketTransferAction(token)
      : transferId
        ? await acceptIncomingTransferAction(transferId)
        : { success: false as const, error: "Missing transfer" };
    if (!result.success) {
      setIsWorking(false);
      setError(result.error);
      return;
    }
    router.push("/profile/tickets");
    router.refresh();
  };

  return (
    <div>
      {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
      <button
        onClick={handleAccept}
        disabled={isWorking}
        className="px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
      >
        {isWorking ? t("working") : t("accept")}
      </button>
    </div>
  );
}
