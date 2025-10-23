"use client";

import IncrementalInput from "@/app/_components/form/IncrementalInput";
import { useState } from "react";
import clsx from "clsx";
import { useCartActions, useCartItems } from "@/app/_stores/CartStore";
import { Product } from "@/domain/product/types/product";
import { getVariantSingleProducts } from "@/domain/cms/transformers/transformToVariantSingleProducts";
import {
  isProductConfigurable,
  isProductSellable,
} from "@/domain/product/businessLogic";
import Link from "next/link";
import ActionButton from "@/app/_components/form/ActionButton";
import { getProductsQtyInCart } from "@/domain/checkout/actions/getProductsQtyInCart";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import { isProductInCart } from "@/domain/checkout/businessRules";

interface Props {
  product: Product;
  defaultQty?: number;
  maxQty?: number;
}

export default function ProductConfigure({ product, defaultQty = 1 }: Props) {
  const { addItem } = useCartActions();
  const cartItems = useCartItems();
  const [productEntity, setProductEntity] = useState<Product | undefined>(
    !isProductConfigurable(product) ? product : undefined
  );
  const [showCartStatus, setShowCartStatus] = useState(false);
  const [productQty, setProductQty] = useState(defaultQty);

  const maxQty = product.limits.quantityLimit ?? 99;
  const numberOfVariants = product.variants.length;

  const isSellableObject = isProductSellable(product);
  const showCartAdd = isSellableObject.isSellable;

  const { isSellable } = isSellableObject;
  const productVariants = getVariantSingleProducts(product);

  const quantityInCart = getProductsQtyInCart(
    cartItems,
    productVariants.length > 0
      ? productVariants.map(product => product.id)
      : [product.id]
  );
  const isInCart = isProductInCart(cartItems, product);

  const handleDecrement = () => {
    setProductQty(prevQty => (prevQty > defaultQty ? prevQty - 1 : defaultQty));
  };

  const handleIncrement = () => {
    setProductQty(prevQty => (prevQty !== maxQty ? prevQty + 1 : maxQty));
  };

  const handleAddToCart = () => {
    if (isSellable && productEntity) {
      addItem(productEntity, productQty);
      setShowCartStatus(true);
    }
  };

  const handleVariantSelection = (product: Product) => {
    setProductEntity(product);
  };

  const handleCloseCartNotice = () => {
    setProductQty(defaultQty);
    setShowCartStatus(false);
  };

  return (
    <div className="flex flex-col items-center align-middle rounded-md relative overflow-hidden gap-x-10 w-full">
      {showCartAdd && numberOfVariants > 0 && (
        <div className="flex flex-col items-center mb-6">
          <div>Select {product.variants[0].variant_type}</div>
          <div className="flex gap-x-3 mt-2">
            {productVariants.map(variantProduct => {
              const middleIndex = Math.floor(numberOfVariants / 2);
              const isMiddle =
                productVariants.indexOf(variantProduct) === middleIndex;
              const isSelected = productEntity
                ? productEntity.uid === variantProduct.uid
                : isMiddle;

              if (isMiddle && !productEntity) {
                setProductEntity(variantProduct);
              }

              return (
                <div
                  key={variantProduct.uid}
                  aria-label={variantProduct.variants[0].variant_value}
                  onClick={() => handleVariantSelection(variantProduct)}
                  className={clsx(
                    "group relative flex items-center justify-center rounded-md border border-gray-300 p-3 cursor-pointer",
                    isSelected && "border-blue-900 bg-blue-700",
                    !isSelected && "bg-neutral-200 hover:bg-neutral-300"
                  )}
                >
                  <span
                    className={clsx(
                      "text-sm font-medium  uppercase group-has-checked:text-neutral-200",
                      isSelected && "text-neutral-200",
                      !isSelected && "text-gray-900 group-hover:text-gray-800"
                    )}
                  >
                    {variantProduct.variants[0].variant_value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showCartAdd && (
        <div>
          <div className={"mb-2 text-center"}>Select quantity</div>
          <IncrementalInput
            handleDecrement={handleDecrement}
            handleIncrement={handleIncrement}
            quantity={productQty}
          />
          {isInCart && (
            <div className={"text-sm text-neutral-400 mt-4"}>
              (You have {quantityInCart} in{" "}
              <Link href={"/store/checkout"}>cart</Link>)
            </div>
          )}
        </div>
      )}

      {showCartAdd && (
        <>
          <ActionButton onClick={handleAddToCart} className={"mt-10"}>
            Add to cart
          </ActionButton>
          <div
            className={clsx(
              "bg-neutral-600  w-full h-full absolute left-0 transition-transform duration-300 ease-in-out p-4 text-neutral-200 flex flex-col",
              !showCartStatus && "translate-y-full"
            )}
          >
            <div
              className={
                "absolute right-2 top-2 p-2 cursor-pointer hover:scale-110 transition-transform"
              }
              onClick={handleCloseCartNotice}
            >
              ⤫
            </div>
            <div
              className={
                "mb-4 pr-6 text-center flex-1 flex flex-col justify-center"
              }
            >
              <div>
                {showCartStatus && (
                  <div
                    className={
                      "flex w-full justify-center mb-2 text-neutral-100"
                    }
                  >
                    <AnimatedSuccessIcon
                      color={"currentColor"}
                      className={"w-8 h-8"}
                      strokeWidth={7}
                    />
                  </div>
                )}
                <strong>{product.name}</strong> was successfully added to your
                cart!
              </div>
            </div>

            <ActionButton href={"/store/checkout"}>
              Checkout in cart
            </ActionButton>
          </div>
        </>
      )}
    </div>
  );
}
