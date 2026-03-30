import "server-only";

import { DiscordConnector } from "@/lib/services/discord";
import { notificationFooter } from "@/domain/notification/util";
import { DISCORD_POS_WEBHOOK } from "@/lib/services/env/private";

interface PosTransactionNotification {
  type: "DEBIT" | "CREDIT" | "ADMIN_DEBIT" | "ADMIN_CREDIT";
  amount: number; // in cents (positive value)
  balanceAfter: number; // in cents
  note?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  adminName?: string | null;
  registerName?: string | null;
}

const formatCents = (cents: number): string => {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
};

export async function notifyOnPosTransaction(data: PosTransactionNotification) {
  if (!DISCORD_POS_WEBHOOK) {
    return;
  }

  const discord = new DiscordConnector(DISCORD_POS_WEBHOOK);

  try {
    const isDebit = data.type === "DEBIT" || data.type === "ADMIN_DEBIT";
    const isAdmin = data.type === "ADMIN_DEBIT" || data.type === "ADMIN_CREDIT";

    const emoji = isDebit ? "🛒" : "💰";
    const action = isDebit ? "spent" : "added";
    const color = isDebit ? 0xed4245 : 0x57f287; // Red for debit, green for credit

    const title = isAdmin
      ? `${emoji} Admin Wallet ${isDebit ? "Debit" : "Credit"}`
      : `${emoji} POS ${isDebit ? "Purchase" : "Top-up"}`;

    const customerDisplay = data.userName || data.userEmail || "Unknown";

    const fields = [
      {
        name: "Customer",
        value: `\`${customerDisplay}\``,
        inline: true,
      },
      {
        name: "Amount",
        value: `\`${formatCents(data.amount)}\``,
        inline: true,
      },
      {
        name: "Balance After",
        value: `\`${formatCents(data.balanceAfter)}\``,
        inline: true,
      },
    ];

    if (data.note) {
      fields.push({
        name: "Note",
        value: data.note,
        inline: false,
      });
    }

    if (isAdmin && data.adminName) {
      fields.push({
        name: "Admin",
        value: `\`${data.adminName}\``,
        inline: true,
      });
    }

    if (!isAdmin && data.registerName) {
      fields.push({
        name: "Register",
        value: `\`${data.registerName}\``,
        inline: true,
      });
    }

    await discord.sendEmbed({
      content: `${emoji} **${customerDisplay}** ${action} **${formatCents(data.amount)}**`,
      title,
      description: isAdmin
        ? `Admin ${isDebit ? "debited" : "credited"} wallet`
        : `Customer ${action} ${formatCents(data.amount)} at POS`,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: notificationFooter,
    });
  } catch (error) {
    console.error("Failed to send POS transaction Discord notification:", error);
  }
}
