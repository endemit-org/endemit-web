"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  paymentIntentId?: string;
  clientSecret?: string;
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
  const router = useRouter();
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

    // Step 1: Validate payment form with Stripe Elements
    const { error: submitError } = await elements.submit();
    if (submitError) {
      if (
        submitError.type === "card_error" ||
        submitError.type === "validation_error"
      ) {
        onError(submitError.message || "Please check your payment details.");
      } else {
        onError("Please complete the payment form.");
      }
      onProcessingChange(false);
      return;
    }

    // Step 2: Create order and PaymentIntent on server
    const result = await onConfirmPayment();

    if (!result.success) {
      onProcessingChange(false);
      return;
    }

    // If full wallet payment, the redirect already happened
    if (result.fullWalletPayment) {
      return;
    }

    if (!result.orderId || !result.clientSecret) {
      onError("Failed to create order");
      onProcessingChange(false);
      return;
    }

    // Step 3: Confirm payment with Stripe using the clientSecret from server
    // redirect: 'if_required' allows client-side navigation for simple payments
    // while still supporting 3D Secure redirects when needed
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: result.clientSecret,
      confirmParams: {
        return_url: `${PUBLIC_BASE_WEB_URL}/store/checkout/success/${result.paymentIntentId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        onError(error.message || "An error occurred with your payment.");
      } else {
        onError("An unexpected error occurred. Please try again.");
      }
      onProcessingChange(false);
    } else if (paymentIntent?.status === "succeeded") {
      // Payment succeeded without redirect, use client-side navigation
      router.push(`/store/checkout/success/${result.paymentIntentId}`);
    }
    // If redirect was required (3D Secure), user will be redirected via return_url
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
