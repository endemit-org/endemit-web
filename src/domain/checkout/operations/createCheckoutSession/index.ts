import "server-only";

import { stripe } from "@/lib/services/stripe";
import { transformToCheckoutDescription } from "@/domain/checkout/transformers/transformToCheckoutDescription";
import {
  CheckoutSessionMetaData,
  CustomStripeLineItem,
  ShippingAddress,
} from "@/domain/checkout/types/checkout";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

export const createCheckoutSession = async ({
  lineItems,
  discountCodeId,
  email,
  shippingAddress,
  ticketHolders,
  donationAmount,
}: {
  lineItems: CustomStripeLineItem[];
  discountCodeId?: string;
  email: string;
  shippingAddress?: ShippingAddress;
  metadata?: CheckoutSessionMetaData;
  ticketHolders?: string[];
  donationAmount?: number;
}) => {
  const metadata: CheckoutSessionMetaData = {
    requiresShipping: shippingAddress ? "true" : "false",
    includesTickets: ticketHolders ? "true" : "false",
    includesDonation: donationAmount && donationAmount > 0 ? "true" : "false",
    ticketHolders: ticketHolders ? JSON.stringify(ticketHolders) : "",
    donationAmount: donationAmount ? donationAmount.toString() : "0",
  };

  if (shippingAddress) {
    metadata.shippingName = shippingAddress.name;
    metadata.shippingAddressLine1 = shippingAddress.address;
    metadata.shippingCity = shippingAddress.city;
    metadata.shippingPostalCode = shippingAddress.postalCode;
    metadata.shippingCountry = shippingAddress.country;
    metadata.shippingPhone = shippingAddress.phone;
    metadata.shippingEmail = email;
  }

  return await stripe.checkout.sessions.create({
    line_items: lineItems,
    customer_email: email,
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${PUBLIC_BASE_WEB_URL}/store/checkout/success/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${PUBLIC_BASE_WEB_URL}/store/checkout/interrupted/{CHECKOUT_SESSION_ID}`,
    metadata,
    discounts: [
      {
        promotion_code: discountCodeId ?? undefined,
      },
    ],
    payment_intent_data: {
      description: transformToCheckoutDescription(shippingAddress, email),
    },
  });
};
