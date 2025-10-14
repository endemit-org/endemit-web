import { formatPrice, formatWeight } from "@/lib/formatting";
import { Country } from "@/types/country";
import countriesConfig from "@/config/countries.config";
import Spinner from "@/components/Spinner";
import { transformGramToKilogram } from "@/lib/util";
import { DiscountDetails } from "@/types/checkout";

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
  totalItems: number;
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
  totalItems,
}: Props) {
  const destinationCountry = countriesConfig[country];

  return (
    <>
      <h3 className="text-lg font-semibold mb-3">Cart ({totalItems} items)</h3>
      <p className="text-xl font-bold mb-4 text-gray-800">
        Subtotal: {formatPrice(subTotal)}
      </p>
      {shippingCost > 0 && (
        <p className="text-xl font-bold mb-4 text-gray-800">
          Shipping:
          {loadingShippingCost && <Spinner />}
          {!loadingShippingCost && country && (
            <>
              {destinationCountry.flag} {destinationCountry.name}{" "}
              {formatPrice(shippingCost)} -{" "}
              {formatWeight(transformGramToKilogram(orderWeight))}
            </>
          )}
        </p>
      )}
      {loadingPromoCode && <Spinner />}
      {discountObject && discountObject.coupon && (
        <div>
          {discountObject.coupon.percent_off && (
            <p className="text-xl font-bold mb-4 text-gray-800">
              Discount ({discountObject.coupon.percent_off}%):{" "}
              {formatPrice(discountAmount)}
            </p>
          )}
          {discountObject.coupon.amount_off && (
            <p className="text-xl font-bold mb-4 text-gray-800">
              Discount: {formatPrice(discountAmount)}
            </p>
          )}
        </div>
      )}

      <p className="text-xl font-bold mb-4 text-gray-800">
        Total: {formatPrice(total)}
      </p>
    </>
  );
}
