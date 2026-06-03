import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_APPLE_WALLET_WEBHOOK } from "@/lib/services/env/private";

interface StickerConflictNotification {
  code: string;
  attemptingUserId: string;
  attemptingUserName?: string | null;
  attemptingUserEmail?: string | null;
  ownerUserId: string;
}

export async function notifyOnStickerConflict(
  data: StickerConflictNotification
) {
  if (!DISCORD_APPLE_WALLET_WEBHOOK) {
    return;
  }

  const discord = new DiscordConnector(DISCORD_APPLE_WALLET_WEBHOOK);

  try {
    const attemptingDisplay =
      data.attemptingUserName ||
      data.attemptingUserEmail ||
      data.attemptingUserId;

    await discord.sendEmbed({
      content: `⚠️ Sticker conflict on \`${data.code}\``,
      title: "⚠️ Sticker claim conflict",
      description: `User attempted to claim a sticker already linked to someone else. Possible duplicate print or unauthorized claim attempt.`,
      color: 0xfaa61a,
      fields: [
        {
          name: "Code",
          value: `\`${data.code}\``,
          inline: true,
        },
        {
          name: "Attempting user",
          value: `\`${attemptingDisplay}\``,
          inline: true,
        },
        {
          name: "Existing owner",
          value: `\`${data.ownerUserId}\``,
          inline: true,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    });
  } catch (error) {
    console.error("Failed to send sticker conflict Discord notification:", error);
  }
}
