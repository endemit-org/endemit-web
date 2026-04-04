import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_APPLE_WALLET_WEBHOOK } from "@/lib/services/env/private";
import { PUBLIC_CURRENT_ENV } from "@/lib/services/env/public";

const discordWallet = new DiscordConnector(DISCORD_APPLE_WALLET_WEBHOOK ?? "");

export type TicketDownloadType = "image" | "apple_wallet";

interface NotifyOnTicketDownloadParams {
  downloadType: TicketDownloadType;
  ticketShortId: string;
  userEmail: string;
  userName?: string | null;
  eventName?: string;
}

export async function notifyOnTicketDownload({
  downloadType,
  ticketShortId,
  userEmail,
  userName,
  eventName,
}: NotifyOnTicketDownloadParams) {
  const typeEmoji = downloadType === "apple_wallet" ? "📱" : "🖼️";
  const typeLabel = downloadType === "apple_wallet" ? "Apple Wallet" : "Image";

  try {
    await discordWallet.sendEmbed({
      content: `${typeEmoji} **${userName || userEmail}** downloaded ticket \`${ticketShortId}\` as ${typeLabel}\n\u200b`,
      title: `${typeEmoji} Ticket Downloaded`,
      description: `A user downloaded their ticket.`,
      color: downloadType === "apple_wallet" ? 0x000000 : 0x3b82f6,
      fields: [
        {
          name: "Type",
          value: typeLabel,
          inline: true,
        },
        {
          name: "Ticket ID",
          value: `\`${ticketShortId}\``,
          inline: true,
        },
        {
          name: "Environment",
          value: PUBLIC_CURRENT_ENV || "unknown",
          inline: true,
        },
        {
          name: "User",
          value: userName ? `${userName} (${userEmail})` : userEmail,
          inline: false,
        },
        ...(eventName
          ? [
              {
                name: "Event",
                value: eventName,
                inline: false,
              },
            ]
          : []),
      ],
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    });
  } catch (error) {
    console.error("Failed to send ticket download Discord notification:", error);
  }
}
