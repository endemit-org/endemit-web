import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";
import { broadcastToChannel } from "@/lib/services/supabase/broadcast";
import { bustOnPosOrderCreated } from "@/lib/services/cache";

/**
 * Scheduled function that expires pending POS orders that have passed their expiry time.
 * Runs every 10 minutes so stale orders leave the register queue promptly.
 */
export const runPosOrderExpiryAutomation = inngest.createFunction(
  {
    id: "pos-order-expiry",
    retries: 3,
    triggers: [{ cron: "*/10 * * * *" }], // Every 10 minutes
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

    // Forgotten "to serve" orders auto-complete after 6h so the boards
    // never clog — runs every sweep regardless of expirations
    const autoCompleted = await step.run("auto-complete-stale", async () => {
      const result = await prisma.posOrder.updateMany({
        where: {
          fulfillmentStatus: "OPEN",
          paidAt: { lt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
        },
        data: {
          fulfillmentStatus: "COMPLETED",
          fulfilledAt: new Date(),
        },
      });
      return result.count;
    });

    if (expiredOrders.length === 0) {
      return { expired: 0, autoCompleted };
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

    return { expired: expiredOrders.length, autoCompleted };
  }
);
