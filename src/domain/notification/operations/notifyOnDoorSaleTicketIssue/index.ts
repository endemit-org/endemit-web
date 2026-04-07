import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_TICKET_PURCHASE_WEBHOOK } from "@/lib/services/env/private";
import { formatPrice } from "@/lib/util/formatting";

const discordTicketPurchase = new DiscordConnector(
  DISCORD_TICKET_PURCHASE_WEBHOOK ?? ""
);

export async function notifyOnDoorSaleTicketIssue({
  eventName,
  ticketHolderEmail,
  ticketCount,
  totalAmount,
  totalDoorSaleTicketsForEvent,
  createdByUserName,
}: {
  eventName: string;
  ticketHolderEmail: string;
  ticketCount: number;
  totalAmount: number;
  totalDoorSaleTicketsForEvent: number;
  createdByUserName: string;
}) {
  try {
    await discordTicketPurchase.sendEmbed({
      content: `💵 **DOOR SALE** - ${ticketCount} for *${eventName}* sold for **${formatPrice(totalAmount / 100)}** cash\n\u200b`,
      title: `💵 Door Sale Ticket${ticketCount > 1 ? "s" : ""} Sold`,
      description: `**${ticketCount}** door sale ticket${ticketCount > 1 ? "s were" : " was"} sold for **${formatPrice(totalAmount / 100)}**. Total door sales for **${eventName}**: **${totalDoorSaleTicketsForEvent}**`,
      color: 0x22c55e, // Green color for cash sales
      fields: [
        {
          name: "Tickets",
          value: `\`${ticketCount}\``,
          inline: true,
        },
        {
          name: "Amount",
          value: `\`${formatPrice(totalAmount / 100)}\``,
          inline: true,
        },
        {
          name: "Email",
          value: `\`${ticketHolderEmail || "None"}\``,
          inline: true,
        },
        {
          name: "Event",
          value: `\`${eventName}\``,
          inline: false,
        },
        {
          name: "Sold by",
          value: `\`${createdByUserName}\``,
          inline: true,
        },
        {
          name: "Door sales total",
          value: `\`${totalDoorSaleTicketsForEvent}\``,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    });
  } catch (error) {
    console.error("Failed to send Discord door sale notification:", error);
  }
}
