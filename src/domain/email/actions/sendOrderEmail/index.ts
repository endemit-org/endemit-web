import { resend, resendFromEmail } from "@/services/resend";
import { Order } from "@prisma/client";
import { NewOrderToCustomerTemplate } from "@/domain/email/templates";

export const sendOrderEmail = async (order: Order) => {
  return await resend.emails.send({
    from: resendFromEmail,
    to: order.email,
    subject: `Your order @ endemit`,
    react: NewOrderToCustomerTemplate({ order }),
  });
};
