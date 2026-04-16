"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/services/env/public";

const stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface StripeProviderProps {
  children: React.ReactNode;
  amount: number; // Amount in cents
  currency?: string;
}

export default function StripeProvider({
  children,
  amount,
  currency = "eur",
}: StripeProviderProps) {
  const options: StripeElementsOptions = {
    mode: "payment",
    amount,
    currency,
    appearance: {
      labels: "above",
      inputs: "condensed",
      variables: {
        colorPrimary: "#16a34a",
        colorBackground: "#262626",
        colorText: "#e5e5e5",
        colorDanger: "#ef4444",
        fontFamily: "system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "6px",
      },
      rules: {
        ".Input": {
          backgroundColor: "#262626",
          border: "1px solid #404040",
        },
        ".Input:focus": {
          border: "1px solid #16a34a",
          boxShadow: "0 0 0 1px #16a34a",
        },
        ".Label": {
          color: "#a3a3a3",
        },
        ".Tab": {
          backgroundColor: "#171717",
          border: "1px solid #404040",
        },
        ".Tab--selected": {
          backgroundColor: "#262626",
          borderColor: "#16a34a",
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
