import { DiscordConnector } from "@/services/discord";
import { Order } from "@prisma/client";
import { formatDecimalPrice } from "@/lib/formatting";
import { CustomStripeLineItem } from "@/types/checkout";
import { transformPriceFromStripe } from "@/services/stripe/util";

const discordOrders = new DiscordConnector(
  process.env.DISCORD_ORDERS_WEBHOOK ?? ""
);

export async function notifyOnNewOrder(order: Order) {
  try {
    const orderItems = JSON.parse(
      order.items as string
    ) as CustomStripeLineItem[];

    const messageObject = {
      title: "💵 New Order received",
      description: `A new order in total value of **${formatDecimalPrice(Number(order.totalAmount))}** was just received!`,
      color: 0x5865f2,
      fields: [
        {
          name: "Email",
          value: `\`${order.email}\``,
          inline: false,
        },
        ...orderItems.map(item => {
          return {
            name: item.price_data?.product_data?.name || "Product",
            value: `Quantity: \`${item.quantity}\`\nPrice: \`${formatDecimalPrice(transformPriceFromStripe(item.price_data?.unit_amount || 0))}\`\nTotal: \`${formatDecimalPrice(transformPriceFromStripe((item.price_data?.unit_amount || 0) * (item.quantity || 1)))}\``,
            inline: false,
          };
        }),
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "EƎ · ENDEMIT instant notifications",
        icon_url: `${process.env.NEXT_PUBLIC_BASE_URL}/images/endemit-icon-small.png`,
      },
    };

    if (order.name.length > 0) {
      messageObject.fields = [
        {
          name: "Name",
          value: `\`${order.name}\``,
          inline: false,
        },
        ...messageObject.fields,
      ];
    }

    await discordOrders.sendEmbed(messageObject);
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}
