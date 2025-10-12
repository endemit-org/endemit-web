import { discord } from "@/services/discord/discord";

export async function notifyOnNewSubscriber(email: string, listName: string) {
  try {
    await discord.sendEmbed({
      title: "🎉 New Mailing List Subscriber",
      description: `Someone just subscribed to the ENDEMIT ${listName} mailing list!`,
      color: 0x5865f2,
      fields: [
        {
          name: "Email",
          value: `\`${email}\``,
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
