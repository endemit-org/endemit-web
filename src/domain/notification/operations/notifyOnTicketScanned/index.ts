import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_TICKET_SCAN_WEBHOOK } from "@/lib/services/env/private";
import { formatNumber } from "@/lib/util/formatting";

const discordTicketScan = new DiscordConnector(
  DISCORD_TICKET_SCAN_WEBHOOK ?? ""
);

export async function notifyOnTicketScanned({
  eventName,
  ticketPayerEmail,
  ticketHolderName,
  totalTicketsScannedAtEvent,
  totalTicketsSoldForEvent,
  totalTicketsScannedRatio,
}: {
  eventName: string;
  ticketPayerEmail: string;
  ticketHolderName: string;
  totalTicketsScannedAtEvent: number;
  totalTicketsSoldForEvent: number;
  totalTicketsScannedRatio: number;
}) {
  try {
    await discordTicketScan.sendEmbed({
      content: `✅ **${ticketHolderName}** *(${ticketPayerEmail})* scanned at ${eventName} *[${totalTicketsScannedAtEvent}/${totalTicketsSoldForEvent}]*\n\u200b`,
      title: `✅ Ticket scanned at ${eventName}`,
      description: `**${ticketHolderName}**'s ticket was just scanned at ${eventName}! This makes a total of **${totalTicketsScannedAtEvent}** tickets scanned at **${eventName}** so far.`,
      color: 0x5865f2,
      fields: [
        {
          name: "Purchased by:",
          value: `\`${ticketPayerEmail}\``,
          inline: false,
        },
        {
          name: "Ticket holder:",
          value: `\`${ticketHolderName}\``,
          inline: false,
        },
        {
          name: "Event:",
          value: `\`${eventName}\``,
          inline: false,
        },
        {
          name: "Scanned at event:",
          value: `\`${totalTicketsScannedAtEvent} / ${totalTicketsSoldForEvent}\` · \`(${formatNumber(totalTicketsScannedRatio * 100, 2)}%)\``,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    });
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}
