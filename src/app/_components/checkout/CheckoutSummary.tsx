import { formatDecimalPrice, formatWeight } from "@/lib/util/formatting";
import { CountryCode } from "@/domain/checkout/types/country";
import Spinner from "@/app/_components/ui/Spinner";
import { DiscountDetails } from "@/domain/checkout/types/checkout";
import clsx from "clsx";
import { ConvertGramToKilogram } from "@/lib/util/converters";
import { getCountry } from "@/domain/checkout/actions/getCountry";
import { useTranslations } from "next-intl";

interface Props {
  subTotal: number;
  shippingCost: number;
  total: number;
  walletCreditEur?: number;
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

function LineItemSpinner({ text }: { text: string }) {
  return <Spinner text={text} />;
}

export default function CheckoutSummary({
  subTotal,
  shippingCost,
  discountObject,
  discountAmount,
  total,
  walletCreditEur,
  orderWeight,
  country,
  loadingShippingCost,
  loadingPromoCode,
}: Props) {
  const t = useTranslations("checkout.summary");
  const destinationCountry = getCountry(country);
  const showWalletCredit = walletCreditEur && walletCreditEur > 0;
  const showSubtotal = subTotal !== total;

  return (
    <div className="text-md text-neutral-200 space-y-4 pt-4">
      {showSubtotal && (
        <LineItem label={t("subtotal")}>{formatDecimalPrice(subTotal)}</LineItem>
      )}

      {shippingCost > 0 && (
        <LineItem label={t("shipping")}>
          {loadingShippingCost && <LineItemSpinner text={t("loading")} />}
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
        <LineItem label={t("discount")}>
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
                <LineItemSpinner text={t("loading")} />
              ) : (
                formatDecimalPrice(discountAmount)
              )}
            </>
          )}
        </LineItem>
      )}

      {showWalletCredit ? (
        <LineItem label={t("walletCredit")} className="text-blue-400">
          <span>-{formatDecimalPrice(walletCreditEur)}</span>
        </LineItem>
      ) : null}

      <LineItem label={t("total")} className={"text-2xl"}>
        {loadingPromoCode || loadingShippingCost ? (
          <LineItemSpinner text={t("loading")} />
        ) : (
          formatDecimalPrice(total)
        )}
      </LineItem>
    </div>
  );
}
