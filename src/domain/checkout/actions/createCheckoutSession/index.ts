import { stripe } from "@/app/services/stripe";
import { createCheckoutDescription } from "@/domain/checkout/actions";
import {
  CheckoutSessionMetaData,
  CustomStripeLineItem,
  ShippingAddress,
} from "@/types/checkout";

export const createCheckoutSession = async ({
  lineItems,
  discountCodeId,
  email,
  shippingAddress,
}: {
  lineItems: CustomStripeLineItem[];
  discountCodeId?: string;
  email: string;
  shippingAddress?: ShippingAddress;
  metadata?: CheckoutSessionMetaData;
}) => {
  const metadata: CheckoutSessionMetaData = {
    requiresShipping: shippingAddress ? "true" : "false",
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
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/store/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/store/checkout/canceled`,
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
