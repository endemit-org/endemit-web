import { DiscordConnector } from "@/services/discord";
import { Order } from "@prisma/client";
import { formatDecimalPrice } from "../../../../../lib/formatting";
import { notificationFooter } from "@/domain/notification/util";
import { ProductInOrder } from "@/domain/order/types/order";

const discordOrders = new DiscordConnector(
  process.env.DISCORD_ORDERS_WEBHOOK ?? ""
);

export async function notifyOnNewOrder(order: Order) {
  try {
    if (!order.items) {
      return null;
    }
    const orderItems = order.items as unknown as ProductInOrder[];

    const totalOrderAmount = formatDecimalPrice(Number(order.totalAmount));

    const createOrderItemsValues = orderItems.map(item => {
      return `Product: **${item.name ?? "Product"}**\nPrice: **${formatDecimalPrice((item.price || 0) * (item.quantity || 1))}** _(${item.quantity} * ${formatDecimalPrice(item.price || 0)})_`;
    });

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
        {
          name: "Order items",
          value: createOrderItemsValues.join("\n\n"),
          inline: false,
        },
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
