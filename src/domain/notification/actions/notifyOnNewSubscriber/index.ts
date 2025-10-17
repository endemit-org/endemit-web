import { DiscordConnector } from "@/services/discord";
import { notificationFooter } from "@/domain/notification/util";

const discordNewsletter = new DiscordConnector(
  process.env.DISCORD_NEWSLETTER_WEBHOOK ?? ""
);

export async function notifyOnNewSubscriber(email: string, listName: string) {
  try {
    await discordNewsletter.sendEmbed({
      title: "🎉 New Mailing List Subscriber",
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
