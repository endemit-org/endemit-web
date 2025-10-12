import { discord } from "@/services/discord/discord";
import { formatPrice } from "@/lib/formatting";

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
    await discord.sendEmbed({
      title: `✅ Ticket scanned at ${eventName}`,
      description: `**${ticketHolderName}**'s ticket was just scanned at ${eventName}! This makes a total of **${totalTicketsScannedAtEvent}** tickets scanned at ${eventName} so far.`,
      color: 0x5865f2,
      fields: [
        {
          name: "Purchased by",
          value: `\`${ticketPayerEmail}\``,
          inline: false,
        },
        {
          name: "Ticket holder",
          value: `\`${ticketHolderName}\``,
          inline: false,
        },
        {
          name: "Event",
          value: `\`${eventName}\``,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "EƎ · ENDEMIT instant notifications",
        icon_url: `${process.env.NEXT_PUBLIC_BASE_URL}/images/endemit-icon-small.png`,
      },
    });
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}
