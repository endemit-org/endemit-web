"use client";

import AddToWalletButton from "@/app/_components/ticket/AddToWalletButton";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import { logTicketDownloadAction } from "@/domain/ticket/actions/logTicketDownloadAction";

interface Props {
  ticketHash: string;
  shortId: string;
  size?: "sm" | "default";
}

// Client wrapper so the server-rendered admin page can wire the download
// logging callback. Admin is unlocalized, so English default labels apply.
export default function AdminAddToWalletButton({
  ticketHash,
  shortId,
  size,
}: Props) {
  return (
    <AddToWalletButton
      passUrl={`${PUBLIC_BASE_WEB_URL}/api/v1/tickets/wallet-pass/${ticketHash}`}
      onDownload={() =>
        logTicketDownloadAction({
          ticketShortId: shortId,
          downloadType: "apple_wallet",
        })
      }
      size={size}
    />
  );
}
