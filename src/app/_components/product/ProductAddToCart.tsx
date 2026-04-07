import clsx from "clsx";
import { formatPrice } from "@/lib/util/formatting";
import ProductConfigure from "@/app/_components/product/ProductConfigure";
import { getStatusText, ensureTypeIsDate } from "@/lib/util/util";
import { getProductLimits } from "@/domain/product/actions/getProductLimits";
import { isProductSellable, isCutoffWithin48Hours } from "@/domain/product/businessLogic";
import { Product } from "@/domain/product/types/product";
import ProductCountdown from "@/app/_components/product/ProductCountdown";

type Props = {
  product: Product;
};

export default function ProductAddToCart({ product }: Props) {
  const productLimits = getProductLimits(product);
  const isSellableObject = isProductSellable(product);

  const cutoffTimestamp = product.limits?.cutoffTimestamp;
  const shouldShowCountdown = isCutoffWithin48Hours(product);

  return (
    <>
      {" "}
      <div>Price:</div>
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
            Product no longer available
          </div>
        )}
      {!isSellableObject.isSellable && !isSellableObject.isSellableByStatus && (
        <div className={"uppercase font-bold"}>
          {getStatusText(product.status)}
        </div>
      )}
      {(productLimits.length > 0 || shouldShowCountdown) && (
        <div
          className={
            "border-t border-neutral-500 mt-6 pt-6 text-sm text-neutral-400 w-full text-center"
          }
        >
          {productLimits.map((productLimit, index) => (
            <div key={`prod-limit-${index}`}>{productLimit}</div>
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
