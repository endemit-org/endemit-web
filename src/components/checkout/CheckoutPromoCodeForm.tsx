import { DiscountDetails } from "@/types/checkout";

interface CheckoutPromoCodeFormProps {
  discount: DiscountDetails | undefined;
  promoCodeValue: string;
  onPromoCodeChange: (value: string) => void;
  onApplyPromoCode: () => void;
  onRemovePromoCode: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export default function CheckoutPromoCodeForm({
  discount,
  promoCodeValue,
  onPromoCodeChange,
  onApplyPromoCode,
  onRemovePromoCode,
  isLoading,
  errorMessage,
}: CheckoutPromoCodeFormProps) {
  // Show applied state
  if (discount?.success) {
    return (
      <div className="p-3 bg-green-50 border border-green-200 rounded mb-4">
        <span className="text-green-700">
          Promo code <strong>{discount.promoCodeKey}</strong> applied
        </span>{" "}
        <button
          onClick={onRemovePromoCode}
          className="text-red-600 hover:text-red-800 underline"
          disabled={isLoading}
        >
          Remove
        </button>
      </div>
    );
  }

  // Show input form
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        Got a promo code?
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={promoCodeValue}
          onChange={e => onPromoCodeChange(e.target.value)}
          placeholder="Enter promo code"
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          onClick={onApplyPromoCode}
          disabled={isLoading || !promoCodeValue}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Applying..." : "Apply"}
        </button>
      </div>
      {errorMessage && (
        <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
