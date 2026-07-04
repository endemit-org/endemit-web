import { ProductStatus } from "@/domain/product/types/product";
import clsx from "clsx";
import { useTranslations } from "next-intl";

import { getStatusTagStyle } from "@/domain/product/actions/getStatusTagStyle";

interface Props {
  status: ProductStatus;
  className?: string;
}

export default function ProductStatusTag({ status, className }: Props) {
  const t = useTranslations("store");

  if (status === ProductStatus.AVAILABLE) {
    return;
  }

  const statusText: Record<ProductStatus, string> = {
    [ProductStatus.AVAILABLE]: t("product.statusText.available"),
    [ProductStatus.PREORDER]: t("product.statusText.preorder"),
    [ProductStatus.COMING_SOON]: t("product.statusText.comingSoon"),
    [ProductStatus.OUT_OF_STOCK]: t("product.statusText.outOfStock"),
    [ProductStatus.SOLD_OUT]: t("product.statusText.soldOut"),
  };

  const variableColours = getStatusTagStyle(status);

  return (
    <div
      className={clsx(
        variableColours,
        "absolute z-10 rounded-md px-2 py-1 text-sm font-semibold  uppercase tracking-wide",
        className
      )}
    >
      {statusText[status]}
    </div>
  );
}
