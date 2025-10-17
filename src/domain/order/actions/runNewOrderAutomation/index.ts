import { inngest } from "@/services/inngest";
import { getOrderById } from "@/domain/order/actions";
import assert from "node:assert";
import { sendOrderEmail } from "@/domain/email/actions";
import {
  OrderNotificationData,
  OrderQueueEvent,
} from "@/domain/order/types/order";
import { notifyOnNewOrder } from "@/domain/notification/actions";

export const runNewOrderAutomation = inngest.createFunction(
  { id: "notify-order-function", retries: 5 },
  { event: OrderQueueEvent.NOTIFY_ON_ORDER },
  async ({ event, step }) => {
    const { orderId } = event.data as OrderNotificationData;

    const order = await getOrderById(orderId);

    assert(order !== null, `Order not found: ${orderId}`);

    await step.run("send-order-email", async () => {
      try {
        const result = await sendOrderEmail(order);

        if (!result || result.error) {
          throw new Error(
            `Failed to send order email: ${result?.error || "Unknown error"}`
          );
        }

        return result;
      } catch (error) {
        // Detect rate limit errors
        if (error instanceof Error) {
          if (
            error.message.includes("429") ||
            error.message.includes("rate limit")
          ) {
            throw new Error(
              `Rate limit hit when sending email for order ${order.id}`
            );
          }
        }

        throw new Error(`Email send failed for order ${order.id}: ${error}`);
      }
    });

    await step.run("send-instant-notification", async () => {
      return await notifyOnNewOrder(order);
    });

    return { orderId: order.id };
  }
);
