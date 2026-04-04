import "server-only";

import { stripe } from "@/lib/services/stripe";
import { transformToCheckoutDescription } from "@/domain/checkout/transformers/transformToCheckoutDescription";
import { ShippingAddress } from "@/domain/checkout/types/checkout";
import Stripe from "stripe";

export interface CreatePaymentIntentParams {
  orderId: string;
  amountInCents: number;
  email: string;
  shippingAddress?: ShippingAddress;
  ticketHolders?: string[];
  donationAmount?: number;
  walletCreditAmount?: number;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export const createPaymentIntent = async ({
  orderId,
  amountInCents,
  email,
  shippingAddress,
  ticketHolders,
  donationAmount,
  walletCreditAmount = 0,
}: CreatePaymentIntentParams): Promise<CreatePaymentIntentResult> => {
  const metadata: Stripe.MetadataParam = {
    orderId,
    requiresShipping: shippingAddress ? "true" : "false",
    includesTickets: ticketHolders ? "true" : "false",
    includesDonation: donationAmount && donationAmount > 0 ? "true" : "false",
    donationAmount: donationAmount ? donationAmount.toString() : "0",
    walletCreditAmount: walletCreditAmount.toString(),
  };

  if (ticketHolders) {
    metadata.ticketHolders = JSON.stringify(ticketHolders);
  }

  if (shippingAddress) {
    metadata.shippingName = shippingAddress.name;
    metadata.shippingAddressLine1 = shippingAddress.address;
    metadata.shippingCity = shippingAddress.city;
    metadata.shippingPostalCode = shippingAddress.postalCode;
    metadata.shippingCountry = shippingAddress.country;
    metadata.shippingPhone = shippingAddress.phone;
    metadata.shippingEmail = email;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "eur",
    receipt_email: email,
    description: transformToCheckoutDescription(shippingAddress, email),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Failed to create payment intent - no client secret");
  }

  return {
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};
