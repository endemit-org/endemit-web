import ActionButton from "@/components/form/ActionButton";
import clsx from "clsx";
import Image from "next/image";

interface CheckoutActionsProps {
  onCheckout: () => void;
  canProceed: boolean;
  isProcessing: boolean;
  errorMessages: Record<
    string,
    | string
    | {
        [p: string]: string;
      }
    | undefined
  >;
}

export default function CheckoutActions({
  onCheckout,
  canProceed,
  isProcessing,
  errorMessages,
}: CheckoutActionsProps) {
  const remainingFields = Object.keys(errorMessages).length;

  return (
    <div className="mt-6 space-y-2">
      <ActionButton
        onClick={canProceed ? onCheckout : undefined}
        disabled={!canProceed}
        className={clsx(
          canProceed && "animate-rave-125bmp hover:[animation:none]"
        )}
      >
        {isProcessing && canProceed
          ? "Redirecting you to payment..."
          : "Pay securely with Stripe"}
      </ActionButton>
      {!canProceed && (
        <div className={"text-neutral-400 text-sm text-center"}>
          Please fill in all required fields to proceed to credit card payment.{" "}
          Fill in the remaining <strong>{remainingFields}</strong> required
          fields.
        </div>
      )}
      <div className="text-center w-full pt-4">
        <Image
          src="/images/powered-by-stripe.png"
          alt="Powered by Stripe"
          className="inline"
          width={180}
          height={44}
        />
      </div>
    </div>
  );
}
