"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Product, ProductCategory } from "@/domain/product/types/product";
import { isProductSellable } from "@/domain/product/businessLogic";
import { useCartActions } from "@/app/_stores/CartStore";
import { formatPrice } from "@/lib/util/formatting";
import clsx from "clsx";

interface WalletTopUpProps {
  products: Product[];
  onClose: () => void;
}

export default function WalletTopUp({ products, onClose }: WalletTopUpProps) {
  const router = useRouter();
  const { addItem, clearCart } = useCartActions();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filter to only sellable currency products
  const currencyProducts = products
    .filter(p => p.category === ProductCategory.CURRENCIES)
    .filter(p => isProductSellable(p).isSellable)
    .sort((a, b) => a.price - b.price);

  const handleTopUp = async () => {
    if (!selectedProduct) return;

    setIsLoading(true);

    // Store return URL for after checkout success
    localStorage.setItem("checkoutReturnUrl", "/profile/wallet");

    // Clear cart and add the selected top-up product
    clearCart();
    addItem(selectedProduct, 1);

    // Navigate to checkout
    router.push("/store/checkout");
  };

  if (currencyProducts.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-neutral-400">
          No top-up options available at the moment.
        </p>
        <button
          onClick={onClose}
          className="mt-4 text-sm text-neutral-500 hover:text-white transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 relative z-10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-neutral-200">
          Select Top-Up Amount
        </h3>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {currencyProducts.map((product, index) => (
          <button
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className={clsx(
              "p-4 rounded-xl border-2 transition-all text-left relative",
              selectedProduct?.id === product.id
                ? "border-blue-500 bg-blue-500/10 backdrop-blur-sm"
                : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
            )}
          >
            {index === 1 && (
              <Image
                src="/images/flame.gif"
                alt="Hot"
                width={24}
                height={24}
                className="absolute -top-2 -right-2 w-6 h-6"
                unoptimized
              />
            )}
            <div className="text-xl font-bold text-neutral-200">
              {formatPrice(product.price)}
            </div>
            <div className="text-sm text-neutral-400 mt-1">{product.name}</div>
          </button>
        ))}
      </div>

      <button
        onClick={handleTopUp}
        disabled={!selectedProduct || isLoading}
        className={clsx(
          "w-full py-3 px-6 rounded-xl font-medium transition-colors",
          selectedProduct && !isLoading
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
        )}
      >
        {isLoading
          ? "Redirecting..."
          : selectedProduct
            ? `Add ${formatPrice(selectedProduct.price)} to Wallet`
            : "Select an amount"}
      </button>

      <p className="text-xs text-neutral-500 text-center">
        You&apos;ll be redirected to checkout to complete the payment.
      </p>
    </div>
  );
}
