import clsx from "clsx";
import { formatPrice } from "@/lib/util/formatting";
import ProductConfigure from "@/app/_components/product/ProductConfigure";
import { ensureTypeIsDate } from "@/lib/util/util";
import {
  getProductLimits,
  type ProductLimit,
} from "@/domain/product/actions/getProductLimits";
import { formatDateTime } from "@/lib/util/formatting";
import { useLocale } from "next-intl";
import { isProductSellable, isCutoffWithin48Hours } from "@/domain/product/businessLogic";
import { Product, ProductStatus } from "@/domain/product/types/product";
import ProductCountdown from "@/app/_components/product/ProductCountdown";
import { useTranslations } from "next-intl";

type Props = {
  product: Product;
};

export default function ProductAddToCart({ product }: Props) {
  const t = useTranslations("store");
  const locale = useLocale() as "sl" | "en";
  const productLimits = getProductLimits(product);
  const isSellableObject = isProductSellable(product);

  const limitText = (limit: ProductLimit) => {
    switch (limit.type) {
      case "maxQuantity":
        return t("product.limits.maxQuantity", { quantity: limit.quantity });
      case "regional":
        return t("product.limits.regional", { regions: limit.regions });
      case "availableUntil":
        return t("product.limits.availableUntil", {
          date: formatDateTime(limit.date, locale),
        });
      case "limitedAvailability":
        return t("product.limits.limitedAvailability");
    }
  };

  const cutoffTimestamp = product.limits?.cutoffTimestamp;
  const shouldShowCountdown = isCutoffWithin48Hours(product);

  const statusText: Record<ProductStatus, string> = {
    [ProductStatus.AVAILABLE]: t("product.statusText.available"),
    [ProductStatus.PREORDER]: t("product.statusText.preorder"),
    [ProductStatus.COMING_SOON]: t("product.statusText.comingSoon"),
    [ProductStatus.OUT_OF_STOCK]: t("product.statusText.outOfStock"),
    [ProductStatus.SOLD_OUT]: t("product.statusText.soldOut"),
  };

  return (
    <>
      {" "}
      <div>{t("product.price")}</div>
      <div
        className={clsx(
          "text-4xl font-heading mb-6",
          !isSellableObject.isSellable && "line-through"
        )}
      >
        {formatPrice(product.price)}
      </div>
      <ProductConfigure product={product} />
      {!isSellableObject.isSellable &&
        !isSellableObject.isSellableByCutoffDate && (
          <div className={"uppercase font-bold"}>
            {t("product.noLongerAvailable")}
          </div>
        )}
      {!isSellableObject.isSellable && !isSellableObject.isSellableByStatus && (
        <div className={"uppercase font-bold"}>
          {statusText[product.status]}
        </div>
      )}
      {(productLimits.length > 0 || shouldShowCountdown) && (
        <div
          className={
            "border-t border-neutral-500 mt-6 pt-6 text-sm text-neutral-400 w-full text-center"
          }
        >
          {productLimits.map((productLimit, index) => (
            <div key={`prod-limit-${index}`}>{limitText(productLimit)}</div>
          ))}
          {shouldShowCountdown && cutoffTimestamp && (
            <ProductCountdown
              cutoffTimestamp={ensureTypeIsDate(cutoffTimestamp)}
            />
          )}
        </div>
      )}
    </>
  );
}
