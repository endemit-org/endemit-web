import { formatPrice } from "@/lib/formatting";

interface CheckoutDonationProps {
  donationAmount: number;
  roundedTotal: number;
  onAddDonation: () => void;
}

export default function CheckoutDonation({
  donationAmount,
  roundedTotal,
  onAddDonation,
}: CheckoutDonationProps) {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
      <p className="text-sm text-gray-700 mb-2">
        Add {formatPrice(donationAmount)} donation to your total and round up to{" "}
        {formatPrice(roundedTotal)}? Donations support our voluntary work and
        help us keep ticket prices low.
      </p>
      <button
        onClick={onAddDonation}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
      >
        Add {formatPrice(donationAmount)} donation
      </button>
    </div>
  );
}
