import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import { prisma } from "@/lib/services/prisma";
import { OrderShippedToCustomerTemplate } from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";
import { isPickupOrder } from "@/domain/order/businessLogic";

export const sendOrderShippedEmail = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      email: true,
      locale: true,
      shippingRequired: true,
      deliveryMethod: true,
      pickupEventName: true,
      pickupEventDate: true,
    },
  });

  if (!order) {
    console.error(`Order not found for shipped email: ${orderId}`);
    return null;
  }

  if (isBlockedEmail(order.email)) {
    console.log(`Skipping shipped email to blocked address: ${order.email}`);
    return null;
  }

  // Pickup orders reuse IN_DELIVERY as "ready for pickup"
  const pickup = isPickupOrder(order)
    ? { eventName: order.pickupEventName, eventDate: order.pickupEventDate }
    : undefined;
  const t = getEmailTranslator(
    order.locale,
    pickup ? "emails.orderReadyForPickup" : "emails.orderShipped"
  );

  return await resend.emails.send({
    from: resendFromEmail,
    to: order.email,
    subject: t("subject"),
    react: OrderShippedToCustomerTemplate({
      orderId: order.id,
      locale: order.locale,
      pickup,
    }),
  });
};
