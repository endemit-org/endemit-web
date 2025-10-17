import { formatDecimalPrice, formatWeight } from "@/lib/formatting";
import { Country } from "@/types/country";
import countriesConfig from "@/config/countries.config";
import Spinner from "@/components/Spinner";
import { transformGramToKilogram } from "@/lib/util";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import clsx from "clsx";

interface Props {
  subTotal: number;
  shippingCost: number;
  total: number;
  orderWeight: number;
  discountObject?: DiscountDetails;
  discountAmount: number;
  country: Country;
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
  return (
    <span className={"text-neutral-400 gap-x-2 font-sm flex text-sm"}>
      <Spinner /> Loading
    </span>
  );
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
  const destinationCountry = countriesConfig[country];

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
                {" -  "} {formatWeight(transformGramToKilogram(orderWeight))}
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
