import "server-only";

import { inngest } from "@/lib/services/inngest";

import assert from "node:assert";

import {
  OrderNotificationData,
  OrderQueueEvent,
} from "@/domain/order/types/order";
import { sendOrderEmailToCustomer } from "@/domain/email/operations/sendOrderEmailToCustomer";
import { getOrderById } from "@/domain/order/operations/getOrderById";
import { notifyOnNewOrder } from "@/domain/notification/operations/notifyOnNewOrder";
import { sendOrderEmailToMerchant } from "@/domain/email/operations/sendOrderEmailToMerchant";

export const runNewOrderAutomation = inngest.createFunction(
  { id: "notify-order-function", retries: 5 },
  { event: OrderQueueEvent.NOTIFY_ON_ORDER },
  async ({ event, step }) => {
    const { orderId } = event.data as OrderNotificationData;

    const order = await getOrderById(orderId);

    assert(order !== null, `Order not found: ${orderId}`);

    await step.run("send-order-email-to-customer", async () => {
      try {
        const result = await sendOrderEmailToCustomer(order);

        if (!result || result.error) {
          throw new Error(
            `Failed to send order email to customer: ${result?.error || "Unknown error"}`
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
              `Rate limit hit when sending customer email for order ${order.id}`
            );
          }
        }

        throw new Error(
          `Customer email send failed for order ${order.id}: ${error}`
        );
      }
    });

    await step.run("send-order-email-to-merchant", async () => {
      try {
        const result = await sendOrderEmailToMerchant(order);

        if (!result || result.error) {
          throw new Error(
            `Failed to send order email to merchant: ${result?.error || "Unknown error"}`
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
              `Rate limit hit when sending merchant email for order ${order.id}`
            );
          }
        }

        throw new Error(
          `Merchant email send failed for order ${order.id}: ${error}`
        );
      }
    });

    await step.run("send-instant-notification", async () => {
      return await notifyOnNewOrder(order);
    });

    return { orderId: order.id };
  }
);
