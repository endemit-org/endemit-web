import { formatDecimalPrice, formatWeight } from "@/lib/util/formatting";
import { CountryCode } from "@/domain/checkout/types/country";
import Spinner from "@/app/_components/ui/Spinner";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import clsx from "clsx";
import { ConvertGramToKilogram } from "@/lib/util/converters";
import { getCountry } from "@/domain/checkout/actions/getCountry";

interface Props {
  subTotal: number;
  shippingCost: number;
  total: number;
  orderWeight: number;
  discountObject?: DiscountDetails;
  discountAmount: number;
  country: CountryCode;
  loadingShippingCost: boolean;
  loadingPromoCode?: boolean;
}

function LineItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex justify-between mb-2", className)}>
      <span>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function LineItemSpinner() {
  return <Spinner text={"Loading..."} />;
}

export default function CheckoutSummary({
  subTotal,
  shippingCost,
  discountObject,
  discountAmount,
  total,
  orderWeight,
  country,
  loadingShippingCost,
  loadingPromoCode,
}: Props) {
  const destinationCountry = getCountry(country);

  return (
    <div className="text-md text-neutral-200 space-y-4 py-4">
      <LineItem label={"Subtotal:"}>{formatDecimalPrice(subTotal)}</LineItem>

      {shippingCost > 0 && (
        <LineItem label={"Shipping:"}>
          {loadingShippingCost && <LineItemSpinner />}
          {!loadingShippingCost && country && (
            <>
              <div className="text-right">
                {formatDecimalPrice(shippingCost)}
              </div>
              <div className={"text-xs text-neutral-400 text-right"}>
                {destinationCountry.flag} {destinationCountry.name}
                {" -  "} {formatWeight(ConvertGramToKilogram(orderWeight))}
              </div>
            </>
          )}
        </LineItem>
      )}

      {discountObject && discountObject.coupon && (
        <LineItem label={"Discount:"}>
          {discountObject.coupon.percent_off && (
            <>
              <span className={"mr-6 italic text-neutral-400"}>
                (-{discountObject.coupon.percent_off}%)
              </span>
              {formatDecimalPrice(discountAmount)}
            </>
          )}
          {discountObject.coupon.amount_off && (
            <>
              {loadingPromoCode ? (
                <LineItemSpinner />
              ) : (
                formatDecimalPrice(discountAmount)
              )}
            </>
          )}
        </LineItem>
      )}

      <LineItem label={"Total:"} className={"text-2xl"}>
        {loadingPromoCode || loadingShippingCost ? (
          <LineItemSpinner />
        ) : (
          formatDecimalPrice(total)
        )}
      </LineItem>
    </div>
  );
}
