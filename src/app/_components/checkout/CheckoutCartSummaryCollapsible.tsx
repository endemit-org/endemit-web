"use client";

import { useState } from "react";
import { CartItem } from "@/domain/checkout/types/cartItem";
import { formatDecimalPrice } from "@/lib/util/formatting";
import CheckoutItemList from "@/app/_components/checkout/CheckoutItemList";
import clsx from "clsx";

interface Props {
  items: CartItem[];
  totalItems: number;
  subTotal: number;
  defaultExpanded?: boolean;
}

export default function CheckoutCartSummaryCollapsible({
  items,
  totalItems,
  subTotal,
  defaultExpanded = false,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-neutral-700/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-700/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={clsx(
              "w-4 h-4 text-neutral-400 transition-transform",
              isExpanded && "rotate-90"
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-neutral-200">
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
        </div>
        <span className="text-neutral-200 font-medium">
          {formatDecimalPrice(subTotal)}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-neutral-600">
          <div className="pt-4">
            <CheckoutItemList items={items} editable={false} />
          </div>
        </div>
      )}
    </div>
  );
}
