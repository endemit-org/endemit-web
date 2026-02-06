"use client";

import { Product } from "@/domain/product/types/product";
import { isProductSellable, isProductSoldOut } from "@/domain/product/businessLogic";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { formatPrice } from "@/lib/util/formatting";
import { getTicketQuantityForProduct } from "@/domain/product/businessLogic";

interface EventTicketAccordionItemProps {
  product: Product;
}

export default function EventTicketAccordionItem({
  product,
}: EventTicketAccordionItemProps) {
  const { isSellable } = isProductSellable(product);
  const isSoldOut = isProductSoldOut(product);
  const ticketQuantity = getTicketQuantityForProduct(product);

  return (
    <div className="flex flex-col gap-4">
      {product.images?.[0] && (
        <div className="w-full">
          <ImageWithFallback
            src={product.images[0].src}
            alt={product.images[0].alt ?? product.name}
            width={400}
            height={229}
            placeholder={product.images[0].placeholder}
            className="w-full h-auto rounded"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {product.checkoutDescription && (
          <p className="text-neutral-700 text-sm">{product.checkoutDescription}</p>
        )}

        {ticketQuantity > 1 && (
          <p className="text-neutral-600 text-sm">
            This ticket includes entry for {ticketQuantity} {ticketQuantity === 1 ? "person" : "people"}
          </p>
        )}

        {isSoldOut && (
          <div className="bg-red-100 text-red-800 px-3 py-2 rounded text-sm font-medium">
            SOLD OUT
          </div>
        )}

        {!isSellable && !isSoldOut && (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm font-medium">
            Not available
          </div>
        )}
      </div>

      {isSellable && <ProductAddToCart product={product} />}
    </div>
  );
}

export function formatTicketTitle(product: Product): string {
  const ticketQuantity = getTicketQuantityForProduct(product);
  const quantitySuffix = ticketQuantity > 1 ? ` (${ticketQuantity} entries)` : "";
  return `${product.name}${quantitySuffix} - ${formatPrice(product.price)}`;
}
