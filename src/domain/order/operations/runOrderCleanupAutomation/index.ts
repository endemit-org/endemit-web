import "server-only";

import { inngest } from "@/lib/services/inngest";
import { prisma } from "@/lib/services/prisma";

// Orders older than this will be marked as expired
const ORDER_EXPIRY_HOURS = 24;

/**
 * Scheduled function that expires unpaid orders (status CREATED) that are older than 24 hours.
 * Runs every 6 hours.
 */
export const runOrderCleanupAutomation = inngest.createFunction(
  { id: "order-cleanup", retries: 3 },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const expiryThreshold = new Date(
      Date.now() - ORDER_EXPIRY_HOURS * 60 * 60 * 1000
    );

    const expiredOrders = await step.run("find-expired-orders", async () => {
      return await prisma.order.findMany({
        where: {
          status: "CREATED",
          createdAt: {
            lt: expiryThreshold,
          },
        },
        select: {
          id: true,
          email: true,
        },
      });
    });

    if (expiredOrders.length === 0) {
      return { expired: 0 };
    }

    await step.run("expire-orders", async () => {
      await prisma.order.updateMany({
        where: {
          id: { in: expiredOrders.map(o => o.id) },
        },
        data: {
          status: "EXPIRED",
        },
      });
    });

    return {
      expired: expiredOrders.length,
      orderIds: expiredOrders.map(o => o.id),
    };
  }
);
