import {
  DiscordEmbed,
  DiscordWebhookPayload,
} from "@/domain/notification/types/discord";

class DiscordConnector {
  readonly webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  async send(payload: DiscordWebhookPayload): Promise<void> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Failed to send Discord message:", error);
      throw error;
    }
  }

  async sendEmbed(embed: DiscordEmbed): Promise<void> {
    return this.send({ embeds: [embed] });
  }
}

export { DiscordConnector };
