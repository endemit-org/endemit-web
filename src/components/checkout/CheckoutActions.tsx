import clsx from "clsx";

interface CheckoutActionsProps {
  onCheckout: () => void;
  onClearCart: () => void;
  canProceed: boolean;
  isProcessing: boolean;
}

export default function CheckoutActions({
  onCheckout,
  onClearCart,
  canProceed,
  isProcessing,
}: CheckoutActionsProps) {
  return (
    <div className="mt-6 space-y-2">
      <button
        onClick={canProceed ? onCheckout : undefined}
        disabled={!canProceed}
        className={clsx(
          "w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors",
          !canProceed && "bg-neutral-600 cursor-not-allowed",
          canProceed && "bg-blue-600 hover:bg-blue-700"
        )}
      >
        {isProcessing ? "Processing..." : "Pay securely with Stripe"}
      </button>

      <button
        onClick={onClearCart}
        disabled={isProcessing}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50"
      >
        Clear Cart
      </button>
    </div>
  );
}
