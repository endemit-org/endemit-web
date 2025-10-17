import { ShippingAddress } from "@/domain/checkout/types/checkout";
import Stripe from "stripe";
import { prisma } from "@/services/prisma";

export const createOrder = async ({
  stripeSessionId,
  name,
  email,
  subtotal,
  shippingCost,
  shippingRequired,
  shippingAddress,
  checkoutItems,
}: {
  stripeSessionId: string;
  name: string;
  email: string;
  subtotal: number;
  shippingCost: number;
  shippingRequired: boolean;
  shippingAddress?: ShippingAddress;
  checkoutItems: Stripe.Checkout.SessionCreateParams.LineItem[];
}) => {
  return await prisma.order.create({
    data: {
      stripeSession: stripeSessionId,
      name,
      email,
      subtotal,
      totalAmount: subtotal + shippingCost,
      shippingAmount: shippingCost,
      shippingRequired,
      shippingAddress: JSON.stringify(shippingAddress),
      items: JSON.stringify(checkoutItems),
    },
  });
};
