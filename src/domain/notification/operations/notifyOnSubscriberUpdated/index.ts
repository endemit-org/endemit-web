import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_NEWSLETTER_WEBHOOK } from "@/lib/services/env/private";

const discordNewsletter = new DiscordConnector(
  DISCORD_NEWSLETTER_WEBHOOK ?? ""
);

interface SubscriberUpdateInfo {
  email: string;
  tags: string[];
  eventName?: string;
  isNew: boolean;
}

export async function notifyOnSubscriberUpdated(info: SubscriberUpdateInfo) {
  const { email, tags, eventName, isNew } = info;

  try {
    const title = isNew
      ? "✉️ New Subscriber from Purchase"
      : "📝 Subscriber Updated from Purchase";

    const description = isNew
      ? "A new subscriber was added from a purchase!"
      : "An existing subscriber's data was updated from a purchase.";

    const fields = [
      {
        name: "Email",
        value: `\`${email}\``,
        inline: false,
      },
    ];

    if (tags.length > 0) {
      fields.push({
        name: "Tags",
        value: tags.map(t => `\`${t}\``).join(", "),
        inline: false,
      });
    }

    if (eventName) {
      fields.push({
        name: "Event",
        value: eventName,
        inline: false,
      });
    }

    await discordNewsletter.sendEmbed({
      content: isNew
        ? `✉️ **${email}** subscribed via purchase\n\u200b`
        : `📝 **${email}** updated via purchase\n\u200b`,
      title,
      description,
      color: isNew ? 0x5865f2 : 0x57f287,
      fields,
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    });
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}
