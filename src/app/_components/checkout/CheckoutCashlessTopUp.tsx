"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Product, ProductCategory } from "@/domain/product/types/product";
import { isProductSellable } from "@/domain/product/businessLogic";
import { formatTokens } from "@/lib/util/currency";
import type { CartItem } from "@/domain/checkout/types/cartItem";
import clsx from "clsx";

interface CheckoutCashlessTopUpProps {
  items: CartItem[];
  currencyProducts: Product[];
  onAddTopUp: (product: Product) => void;
  disabled?: boolean;
}

export default function CheckoutCashlessTopUp({
  items,
  currencyProducts,
  onAddTopUp,
  disabled = false,
}: CheckoutCashlessTopUpProps) {
  // Check if any ticket item has cashless payments enabled
  const hasCashlessEvent = useMemo(() => {
    return items.some(
      item =>
        item.category === ProductCategory.TICKETS &&
        item.relatedEvent?.hasCashlessPayments === true
    );
  }, [items]);

  // Filter to only sellable currency products, sorted by price
  const availableTopUps = useMemo(
    () =>
      currencyProducts
        .filter(p => p.category === ProductCategory.CURRENCIES)
        .filter(p => isProductSellable(p).isSellable)
        .sort((a, b) => a.price - b.price),
    [currencyProducts]
  );

  // Check if any top-up is already in cart
  const topUpInCart = useMemo(() => {
    return items.some(item => item.category === ProductCategory.CURRENCIES);
  }, [items]);

  // Don't show if no cashless event tickets or no top-up options available
  if (!hasCashlessEvent || availableTopUps.length === 0) {
    return null;
  }

  // Don't show if already added a top-up
  if (topUpInCart) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/30 to-neutral-900/30 rounded-lg border border-blue-700/30">
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-lg font-medium text-neutral-200">
            Go Cashless at the Event
          </h4>
          <p className="text-smIf text-neutral-400 mt-1">
            This event uses cashless payments with Endemit Pay. Preload your
            wallet now and enjoy faster service at the bar and food stands.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {availableTopUps.map((product, index) => (
          <button
            key={product.id}
            onClick={() => onAddTopUp(product)}
            disabled={disabled}
            className={clsx(
              "p-3 rounded-lg border transition-all text-center relative",
              "border-neutral-600 bg-neutral-800/50 hover:border-blue-500 hover:bg-blue-500/10",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {index === 1 && (
              <Image
                src="/images/flame.gif"
                alt="Popular"
                width={20}
                height={20}
                className="absolute -top-1.5 -right-1.5 w-5 h-5"
                unoptimized
              />
            )}
            <div className="text-base font-bold text-neutral-200">
              {formatTokens(product.price)}
            </div>
            <div className="text-xs text-blue-400 mt-0.5">+ Add</div>
          </button>
        ))}
      </div>

      <p className="text-xs text-neutral-500 mt-3 text-center">
        You can also top up with cash at the event
      </p>
    </div>
  );
}
