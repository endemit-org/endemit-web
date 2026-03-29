"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import ActionButton from "@/app/_components/form/ActionButton";
import { formatPrice } from "@/lib/util/formatting";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

interface ConfirmPaymentResult {
  success: boolean;
  orderId?: string;
  fullWalletPayment?: boolean;
}

interface PaymentFormProps {
  totalAmount: number;
  isProcessing: boolean;
  onProcessingChange: (processing: boolean) => void;
  onError: (error: string) => void;
  canProceed: boolean;
  onConfirmPayment: () => Promise<ConfirmPaymentResult>;
}

export default function PaymentForm({
  totalAmount,
  isProcessing,
  onProcessingChange,
  onError,
  canProceed,
  onConfirmPayment,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !canProceed) {
      return;
    }

    onProcessingChange(true);
    onError("");

    // Step 1: Create order and validate form
    const result = await onConfirmPayment();

    if (!result.success) {
      onProcessingChange(false);
      return;
    }

    // If full wallet payment, the redirect already happened
    if (result.fullWalletPayment) {
      return;
    }

    if (!result.orderId) {
      onError("Failed to create order");
      onProcessingChange(false);
      return;
    }

    // Step 2: Confirm payment with Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${PUBLIC_BASE_WEB_URL}/store/checkout/success/${result.orderId}`,
      },
    });

    // This point is only reached if there's an immediate error
    // (e.g., card declined). Otherwise, the customer is redirected.
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        onError(error.message || "An error occurred with your payment.");
      } else {
        onError("An unexpected error occurred. Please try again.");
      }
      onProcessingChange(false);
    }
  };

  const isDisabled =
    !stripe || !elements || !isReady || isProcessing || !canProceed;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 mt-8 border-t border-t-neutral-400 pt-8"
    >
      <PaymentElement
        onReady={() => setIsReady(true)}
        options={{
          layout: "tabs",
          wallets: {
            applePay: "auto",
            googlePay: "auto",
          },
        }}
      />

      <ActionButton
        type="submit"
        disabled={isDisabled}
        variant="success"
        className="py-3 text-lg"
      >
        {isProcessing ? "Processing..." : `Pay ${formatPrice(totalAmount)}`}
      </ActionButton>

      <p className="text-xs text-neutral-500 text-center">
        Your payment is securely processed by Stripe. Your card details are
        never stored on our servers.
      </p>
    </form>
  );
}
