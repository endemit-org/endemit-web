import { stripe } from "@/services/stripe";
import { createCheckoutDescription } from "@/domain/checkout/actions";
import {
  CheckoutSessionMetaData,
  CustomStripeLineItem,
  ShippingAddress,
} from "@/domain/checkout/types/checkout";

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

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    customer_email: email,
    mode: "payment",
    payment_method_types: ["card"],
    success_url: `${process.env.NEXT_PUBLIC_BASE_WEB_URL}/store/checkout/success/{CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_WEB_URL}/store/checkout/interrupted/{CHECKOUT_SESSION_ID}`,
    metadata,
    discounts: [
      {
        promotion_code: discountCodeId ?? undefined,
      },
    ],
    payment_intent_data: {
      description: createCheckoutDescription(shippingAddress, email),
    },
  });

  return session;
};
