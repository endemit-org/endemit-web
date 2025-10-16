import { DiscordConnector } from "@/app/services/discord";
import { notificationFooter } from "@/domain/notification/util";

const discordTicketScan = new DiscordConnector(
  process.env.DISCORD_TICKET_SCAN_WEBHOOK ?? ""
);

export async function notifyOnTicketScanned({
  eventName,
  ticketPayerEmail,
  ticketHolderName,
  totalTicketsScannedAtEvent,
}: {
  eventName: string;
  ticketPayerEmail: string;
  ticketHolderName: string;
  totalTicketsScannedAtEvent: number;
}) {
  try {
    await discordTicketScan.sendEmbed({
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
          value: `\`${totalTicketsScannedAtEvent}\``,
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
