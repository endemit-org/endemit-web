import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_TICKET_PURCHASE_WEBHOOK } from "@/lib/services/env/private";

const discordTicketPurchase = new DiscordConnector(
  DISCORD_TICKET_PURCHASE_WEBHOOK ?? ""
);

export async function notifyOnGuestTicketIssue({
  eventName,
  ticketHolderEmail,
  ticketHolderName,
  ticketCount,
  totalGuestTicketsForEvent,
  createdByUserName,
}: {
  eventName: string;
  ticketHolderEmail: string;
  ticketHolderName: string;
  ticketCount: number;
  totalGuestTicketsForEvent: number;
  createdByUserName: string;
}) {
  try {
    await discordTicketPurchase.sendEmbed({
      content: `🎟️ **GUEST LIST** - ${ticketCount} for *${eventName}* added for **${ticketHolderName}**\n\u200b`,
      title: `🎟️ Guest List Ticket${ticketCount > 1 ? "s" : ""} Added`,
      description: `**${ticketCount}** guest list ${ticketCount > 1 ? "were" : "was"} added for **${ticketHolderName}**. Total guest list tickets for **${eventName}**: **${totalGuestTicketsForEvent}**`,
      color: 0x9333ea, // Purple color to distinguish from regular tickets
      fields: [
        {
          name: "Guest(s)",
          value: `\`${ticketHolderName}\``,
          inline: true,
        },
        {
          name: "Email",
          value: `\`${ticketHolderEmail}\``,
          inline: true,
        },
        {
          name: "Tickets",
          value: `\`${ticketCount}\``,
          inline: true,
        },
        {
          name: "Event",
          value: `\`${eventName}\``,
          inline: false,
        },
        {
          name: "Added by",
          value: `\`${createdByUserName}\``,
          inline: true,
        },
        {
          name: "Guest list total",
          value: `\`${totalGuestTicketsForEvent}\``,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    });
  } catch (error) {
    console.error("Failed to send Discord guest ticket notification:", error);
  }
}
