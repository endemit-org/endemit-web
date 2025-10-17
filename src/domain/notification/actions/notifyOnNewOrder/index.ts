import { DiscordConnector } from "@/services/discord";
import { Order } from "@prisma/client";
import { formatDecimalPrice } from "@/lib/formatting";
import { CustomStripeLineItem } from "@/domain/checkout/types/checkout";
import { transformPriceFromStripe } from "@/services/stripe/util";
import { notificationFooter } from "@/domain/notification/util";

const discordOrders = new DiscordConnector(
  process.env.DISCORD_ORDERS_WEBHOOK ?? ""
);

export async function notifyOnNewOrder(order: Order) {
  try {
    const orderItems = JSON.parse(
      order.items as string
    ) as CustomStripeLineItem[];

    const totalOrderAmount = formatDecimalPrice(Number(order.totalAmount));

    const messageObject = {
      title: "💵 New Order received",
      description: `A new order in total value of **${totalOrderAmount}** was just received!`,
      color: 0x5865f2,
      fields: [
        {
          name: "Email",
          value: `\`${order.email}\``,
          inline: false,
        },
        ...orderItems.map(item => {
          return {
            name: item.price_data?.product_data?.name ?? "Product",
            value: `Quantity: \`${item.quantity} * ${formatDecimalPrice(transformPriceFromStripe(item.price_data?.unit_amount || 0))}\`\nTotal: \`${formatDecimalPrice(transformPriceFromStripe((item.price_data?.unit_amount || 0) * (item.quantity || 1)))}\``,
            inline: false,
          };
        }),
        {
          name: "Total order amount",
          value: `\`${totalOrderAmount}\``,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    };

    if (order.name && order.name.length > 0) {
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
