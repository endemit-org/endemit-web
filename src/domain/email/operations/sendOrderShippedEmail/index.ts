import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import { prisma } from "@/lib/services/prisma";
import { OrderShippedToCustomerTemplate } from "@/domain/email/templates";

export const sendOrderShippedEmail = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, email: true },
  });

  if (!order) {
    console.error(`Order not found for shipped email: ${orderId}`);
    return null;
  }

  if (isBlockedEmail(order.email)) {
    console.log(`Skipping shipped email to blocked address: ${order.email}`);
    return null;
  }

  return await resend.emails.send({
    from: resendFromEmail,
    to: order.email,
    subject: `Your order has been shipped!`,
    react: OrderShippedToCustomerTemplate({ orderId: order.id }),
  });
};
