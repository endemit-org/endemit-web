import "server-only";

import { resend, resendFromEmail, isBlockedEmail } from "@/lib/services/resend";
import { prisma } from "@/lib/services/prisma";
import { OrderShippedToCustomerTemplate } from "@/domain/email/templates";
import { getEmailTranslator } from "@/domain/email/getEmailTranslator";

export const sendOrderShippedEmail = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, email: true, locale: true },
  });

  if (!order) {
    console.error(`Order not found for shipped email: ${orderId}`);
    return null;
  }

  if (isBlockedEmail(order.email)) {
    console.log(`Skipping shipped email to blocked address: ${order.email}`);
    return null;
  }

  const t = getEmailTranslator(order.locale, "emails.orderShipped");

  return await resend.emails.send({
    from: resendFromEmail,
    to: order.email,
    subject: t("subject"),
    react: OrderShippedToCustomerTemplate({
      orderId: order.id,
      locale: order.locale,
    }),
  });
};
