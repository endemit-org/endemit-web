import { ShippingAddress } from "@/types/checkout";
import Stripe from "stripe";
import { prisma } from "@/services/prisma";

export const createOrder = async ({
  stripeSessionId,
  email,
  subtotal,
  shippingCost,
  shippingRequired,
  shippingAddress,
  checkoutItems,
}: {
  stripeSessionId: string;
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
      email,
      subtotal: Math.round(subtotal * 100), // in cents
      totalAmount: Math.round((subtotal + shippingCost) * 100),
      shippingAmount: Math.round(shippingCost * 100),
      shippingRequired,
      shippingAddress: JSON.stringify(shippingAddress),
      items: JSON.stringify(checkoutItems),
    },
  });
};
