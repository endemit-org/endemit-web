import {
  DiscordEmbed,
  DiscordWebhookPayload,
} from "@/domain/notification/types/discord";

/**
 * Discord webhook connector with load balancing support.
 *
 * Accepts a comma-delimited string of webhook URLs.
 * On each send, a random webhook is selected from the pool.
 */
class DiscordConnector {
  readonly webhookUrls: string[];

  constructor(webhookUrls: string) {
    this.webhookUrls = webhookUrls
      .split(",")
      .map(url => url.trim())
      .filter(url => url.length > 0);
  }

  private getRandomWebhook(): string {
    const index = Math.floor(Math.random() * this.webhookUrls.length);
    return this.webhookUrls[index];
  }

  async send(payload: DiscordWebhookPayload): Promise<void> {
    const webhookUrl = this.getRandomWebhook();

    try {
      const response = await fetch(webhookUrl, {
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

  async sendEmbed(embed: DiscordEmbed & { content?: string }): Promise<void> {
    const { content, ...embedData } = embed;
    return this.send({
      ...(content && { content }),
      embeds: [embedData],
    });
  }
}

export { DiscordConnector };
