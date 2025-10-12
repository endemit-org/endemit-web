import { discord } from "@/services/discord/discord";
import { Order } from "@prisma/client";
import { formatPrice } from "@/lib/formatting";
import { CustomStripeLineItem } from "@/types/checkout";

export async function notifyOnNewOrder(order: Order) {
  try {
    const orderItems = JSON.parse(
      order.items as string
    ) as CustomStripeLineItem[];
    await discord.sendEmbed({
      title: "💵 New Order received",
      description: `A new order in value of **${formatPrice(order.totalAmount / 100)}** was just received!`,
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
            value: `Quantity: **${item.quantity}**\nPrice: **${formatPrice((item.price_data?.unit_amount || 0) / 100)}**\nTotal: **${formatPrice(((item.price_data?.unit_amount || 0) * (item.quantity || 1)) / 100)}**`,
            inline: false,
          };
        }),
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
