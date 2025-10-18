import { ProductStatus } from "@/domain/product/types/product";
import clsx from "clsx";

import { getStatusTagStyle } from "@/domain/product/actions";
import { getStatusText } from "../../../lib/util";

interface Props {
  status: ProductStatus;
  className?: string;
}

export default function ProductStatusTag({ status, className }: Props) {
  if (status === ProductStatus.AVAILABLE) {
    return;
  }

  const variableColours = getStatusTagStyle(status);

  return (
    <div
      className={clsx(
        variableColours,
        "absolute z-10 rounded-md px-2 py-1 text-sm font-semibold  uppercase tracking-wide",
        className
      )}
    >
      {getStatusText(status)}
    </div>
  );
}
