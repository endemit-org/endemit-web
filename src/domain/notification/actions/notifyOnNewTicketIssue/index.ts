import { discord } from "@/services/discord/discord";
import { formatPrice } from "@/lib/formatting";

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
    await discord.sendEmbed({
      title: `🎫 New Ticket issued for ${eventName}`,
      description: `A new ticket was issued to **${ticketHolderName}**. This makes a total of **${totalTicketsSoldForEvent}** tickets sold for ${eventName} so far.`,
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
