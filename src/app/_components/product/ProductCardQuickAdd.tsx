"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useCartActions } from "@/app/_stores/CartStore";
import { Product } from "@/domain/product/types/product";
import ActionButton from "@/app/_components/form/ActionButton";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import { useTranslations } from "next-intl";

interface Props {
  product: Product;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ProductCardQuickAdd({ product, cardRef }: Props) {
  const t = useTranslations("common");
  const ts = useTranslations("store");
  const { addItem } = useCartActions();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setShowSuccess(true);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSuccess(false);
  };

  const popoverContent = (
    <div
      className={clsx(
        "absolute inset-0 bg-neutral-800/80 backdrop-blur-md transition-opacity duration-300 flex flex-col justify-between p-4 text-neutral-200 z-30 rounded-sm",
        showSuccess ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <button
        className="absolute right-2 top-2 p-2 cursor-pointer hover:scale-110 transition-transform text-xl"
        onClick={handleClose}
        aria-label={t("close")}
      >
        ⤫
      </button>

      <div className="flex-1 flex flex-col justify-center items-center text-center px-6 min-h-0">
        {showSuccess && (
          <div className="flex w-full justify-center mb-2 text-neutral-100">
            <AnimatedSuccessIcon
              color="currentColor"
              className="w-8 h-8"
              strokeWidth={7}
            />
          </div>
        )}
        <div>
          {ts.rich("product.addedToCart", {
            name: product.name,
            strong: chunks => <strong>{chunks}</strong>,
          })}
        </div>
      </div>

      <div className="flex-shrink-0">
        <ActionButton href="/store/checkout" size="sm">
          {ts("product.checkout")}
        </ActionButton>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleAddToCart}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        {ts("product.addToCart")}
      </button>

      {cardRef?.current
        ? createPortal(popoverContent, cardRef.current)
        : popoverContent}
    </>
  );
}
