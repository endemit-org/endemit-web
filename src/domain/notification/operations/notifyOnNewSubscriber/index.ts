import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_NEWSLETTER_WEBHOOK } from "@/lib/services/env/private";

const discordNewsletter = new DiscordConnector(
  DISCORD_NEWSLETTER_WEBHOOK ?? ""
);

export async function notifyOnNewSubscriber(email: string, listName: string) {
  try {
    await discordNewsletter.sendEmbed({
      content: `✉️ **${email}** subscribed to *${listName}*\n\u200b`,
      title: "✉️ New Mailing List Subscriber",
      description: `Someone just subscribed to the our **${listName}** mailing list!`,
      color: 0x5865f2,
      fields: [
        {
          name: "Email",
          value: `\`${email}\``,
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
