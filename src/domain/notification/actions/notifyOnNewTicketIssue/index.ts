import { formatPrice } from "@/lib/formatting";
import { DiscordConnector } from "@/app/services/discord";
import { notificationFooter } from "@/domain/notification/util";

const discordTicketPurchase = new DiscordConnector(
  process.env.DISCORD_TICKET_PURCHASE_WEBHOOK ?? ""
);

export async function notifyOnNewTicketIssue({
  eventName,
  ticketPayerEmail,
  ticketHolderName,
  ticketPrice,
  totalTicketsSoldForEvent,
}: {
  eventName: string;
  ticketPayerEmail: string;
  ticketHolderName: string;
  ticketPrice: number;
  totalTicketsSoldForEvent: number;
}) {
  try {
    await discordTicketPurchase.sendEmbed({
      title: `🎫 New Ticket issued for ${eventName}`,
      description: `A new ticket was issued to **${ticketHolderName}**. This makes a total of **${totalTicketsSoldForEvent}** tickets sold for **${eventName}** so far.`,
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
        {
          name: "Ticket price",
          value: `\`${formatPrice(ticketPrice)}\``,
          inline: false,
        },
        {
          name: "Sold for event:",
          value: `\`${totalTicketsSoldForEvent}\``,
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
