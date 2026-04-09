"use client";

import { useState } from "react";
import clsx from "clsx";
import { useCartActions } from "@/app/_stores/CartStore";
import { Product } from "@/domain/product/types/product";
import ActionButton from "@/app/_components/form/ActionButton";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";

interface Props {
  product: Product;
}

export default function ProductCardQuickAdd({ product }: Props) {
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

  return (
    <>
      <button
        onClick={handleAddToCart}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        Add to cart
      </button>

      <div
        className={clsx(
          "absolute inset-0 bg-neutral-600 transition-opacity duration-300 flex flex-col p-4 text-neutral-200 z-30 rounded-sm",
          showSuccess ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <button
          className="absolute right-2 top-2 p-2 cursor-pointer hover:scale-110 transition-transform text-xl"
          onClick={handleClose}
          aria-label="Close"
        >
          ⤫
        </button>

        <div className="flex-1 flex flex-col justify-center items-center text-center pr-6">
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
            <strong>{product.name}</strong> was added to your cart!
          </div>
        </div>

        <ActionButton href="/store/checkout" size="sm">
          Checkout
        </ActionButton>
      </div>
    </>
  );
}
