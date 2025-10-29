import { formatPrice } from "@/lib/util/formatting";
import Link from "next/link";
import ActionButton from "@/app/_components/form/ActionButton";

interface CheckoutDonationProps {
  donationAmount: number;
  roundedTotal: number;
  onAddDonation: (e: React.MouseEvent) => void;
}

export default function CheckoutDonation({
  donationAmount,
  roundedTotal,
  onAddDonation,
}: CheckoutDonationProps) {
  return (
    <div className="p-4 bg-neutral-200 border border-neutral-400 rounded mb-4 space-y-2 text-center">
      <h3 className={"text-xl"}>
        Donations keep us running{" "}
        <span className={"animate-bounce inline-block ml-2"}>🙏</span>
      </h3>
      <div className="text-sm text-neutral-800 pb-6">
        <p className=" mb-2">
          Add <strong>{formatPrice(donationAmount)} donation</strong> to your
          total
          <br />
          and <strong>round up to {formatPrice(roundedTotal)}</strong>?
        </p>
        <p>
          Donations support our voluntary work and help us keep ticket prices at
          events low.
        </p>
      </div>

      <ActionButton onClick={onAddDonation} size={"sm"}>
        Add {formatPrice(donationAmount)} donation
      </ActionButton>
      <div>
        <Link href={"/about"} className={"link text-sm"} target={"_blank"}>
          More about our non-profit
        </Link>
      </div>
    </div>
  );
}
