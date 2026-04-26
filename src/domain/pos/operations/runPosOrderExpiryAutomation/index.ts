import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { bustOnPosOrderCreated } from "@/lib/services/cache";

/**
 * Scheduled function that expires pending POS orders that have passed their expiry time.
 * Runs once per day at 4am Ljubljana time.
 */
export const runPosOrderExpiryAutomation = inngest.createFunction(
  {
    id: "pos-order-expiry",
    retries: 3,
    triggers: [{ cron: "TZ=Europe/Ljubljana 0 4 * * *" }], // Daily at 4am Ljubljana
  },
  async ({ step }) => {
    const expiredOrders = await step.run("find-expired-orders", async () => {
      return await prisma.posOrder.findMany({
        where: {
          status: "PENDING",
          expiresAt: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          shortCode: true,
          registerId: true,
          customerId: true,
        },
      });
    });

    if (expiredOrders.length === 0) {
      return { expired: 0 };
    }

    await step.run("expire-orders", async () => {
      await prisma.posOrder.updateMany({
        where: {
          id: { in: expiredOrders.map(o => o.id) },
        },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: "expired",
        },
      });
    });

    await step.run("broadcast-expirations", async () => {
      for (const order of expiredOrders) {
        // Notify register
        await broadcastToChannel(
          `pos:register:${order.registerId}`,
          "pos_order_cancelled",
          {
            orderId: order.id,
            shortCode: order.shortCode,
            reason: "expired",
          }
        );

        // Notify customer if they had scanned
        if (order.customerId) {
          await broadcastToChannel(
            `pos:order:${order.id}`,
            "pos_order_cancelled",
            {
              orderId: order.id,
              shortCode: order.shortCode,
              reason: "expired",
            }
          );
        }
      }
    });

    await step.run("bust-cache", async () => {
      await bustOnPosOrderCreated();
    });

    return { expired: expiredOrders.length };
  }
);
