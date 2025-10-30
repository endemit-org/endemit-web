import {
  isProductSellable,
  isProductSellableByCutoffDate,
} from "@/domain/product/businessLogic";
import { ensureTypeIsDate } from "@/lib/util/util";
import Link from "next/link";
import { formatDateTime, formatDecimalPrice } from "@/lib/util/formatting";
import CartQtyControl from "@/app/_components/cart/CartQtyControl";
import shippingService from "@/lib/services/shipping";
import { CountryCode } from "@/domain/checkout/types/country";
import { ReactNode } from "react";
import { getProductLink } from "@/domain/product/actions/getProductLink";
import { CartItem } from "@/domain/checkout/types/cartItem";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";

type Props = {
  item: CartItem;
  country?: CountryCode;
  onRemoveItem?: (id: string) => void;
  editable?: boolean;
};

function CheckoutItemWarning({ children }: { children: ReactNode }) {
  return <div className={"text-orange-400  text-sm pt-2"}>⚠ {children}</div>;
}

export default function CheckoutItem({
  item,
  country,
  onRemoveItem,
  editable = false,
}: Props) {
  const isSellableObject = isProductSellable(item, country);
  const productLink = getProductLink(item.uid, item.category);

  return (
    <div
      key={item.id}
      className="p-3 rounded-md overflow-hidden bg-neutral-700 "
    >
      <div className="flex items-start justify-between gap-x-4 ">
        <div className={"text-lg font-bold text-neutral-300"}>
          {item.images[0].src && (
            <Link className={"link"} href={productLink}>
              <ImageWithFallback
                src={item.images[0].src}
                alt={item.name}
                placeholder={item.images[0].placeholder}
                width={100}
                height={100}
                quality={90}
                className={"aspect-square object-cover w-20 rounded-md"}
              />
            </Link>
          )}
        </div>

        <div className="flex-1">
          <div className="font-medium text-neutral-200 text-sm space-y-1">
            <Link className={"link text-neutral-200"} href={productLink}>
              {item.name}
            </Link>
            <div className={"text-neutral-400"}>
              {formatDecimalPrice(item.price * item.quantity)}
            </div>
            {editable && (
              <div className={"flex w-full justify-between items-end"}>
                <div className={"scale-75 origin-left w-fit"}>
                  <CartQtyControl item={item} />
                </div>
                {onRemoveItem && (
                  <div
                    onClick={() => onRemoveItem(item.id)}
                    className="link text-neutral-500 cursor-pointer text-xs"
                    aria-label="Remove item"
                  >
                    Remove️
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between"></div>
        </div>
      </div>

      {editable && (
        <>
          {!isSellableObject?.isSellableByRegion && country && (
            <CheckoutItemWarning>
              Warning, this product can not be shipped to{" "}
              {shippingService.getCountryDetails(country).name}
            </CheckoutItemWarning>
          )}
          {item?.limits?.quantityLimit &&
            item.quantity > item.limits.quantityLimit && (
              <CheckoutItemWarning>
                Warning, the maximum quantity for this product is{" "}
                {item.limits.quantityLimit}
              </CheckoutItemWarning>
            )}

          {item.limits?.cutoffTimestamp &&
            !isProductSellableByCutoffDate(item) && (
              <CheckoutItemWarning>No longer available</CheckoutItemWarning>
            )}

          {item.limits?.cutoffTimestamp &&
            isProductSellableByCutoffDate(item) && (
              <div className="text-neutral-400  text-sm pt-2">
                This item is available for sale until{" "}
                {formatDateTime(ensureTypeIsDate(item.limits.cutoffTimestamp))}
              </div>
            )}
        </>
      )}
    </div>
  );
}
