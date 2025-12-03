"use client";

import { Product } from "@/domain/product/types/product";
import { Event } from "@/domain/event/types/event";
import { isProductSellable } from "@/domain/product/businessLogic";
import TicketIcon from "@/app/_components/icon/TicketIcon";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { isEventCompleted } from "@/domain/event/businessLogic";

export default function EventTicketDisplay({
  product,
  event,
}: {
  product?: Product | null;
  event: Event;
}) {
  const productAvailable = product && isProductSellable(product).isSellable;
  const isPastEvent = isEventCompleted(event);

  return (
    <div className={"flex flex-col items-center text-neutral-200"}>
      <div className={"font-heading uppercase text-3xl text-neutral-400 mb-8"}>
        {productAvailable && "Tickets available now"}
        {!productAvailable &&
          (isPastEvent || !product
            ? `Tickets not available`
            : `Tickets not available online`)}
      </div>
      {!productAvailable && !isPastEvent && (
        <div
          className={
            "bg-orange-700/90 flex rounded-md px-3 py-2 mb-4 gap-3 backdrop-blur"
          }
        >
          <span className="animate-rave-125bmp text-neutral-950 mt-1">
            <TicketIcon />
          </span>
          <div className="text-neutral-950 uppercase">
            <strong>Tickets available at entrance upon arrival.</strong> Cash
            only.
          </div>
        </div>
      )}
      <div>
        {product && (
          <ImageWithFallback
            src={product.images[0].src}
            alt={product.images[0].alt}
            width={400}
            height={229}
            placeholder={product.images[0].placeholder}
          />
        )}
        {!product && (
          <ImageWithFallback
            src={event.promoImage?.src}
            alt={event.promoImage?.alt ?? ""}
            width={400}
            height={229}
            placeholder={event.promoImage?.placeholder}
          />
        )}
      </div>
      <h2 className={"text-2xl my-6"}>
        {product && productAvailable ? product.name : ""}
        {(!productAvailable || !product) &&
          (isPastEvent
            ? "Tickets have been SOLD OUT."
            : product
              ? "Online tickets SOLD OUT"
              : "Tickets are not for sale yet")}
      </h2>
      {productAvailable && <ProductAddToCart product={product} />}
    </div>
  );
}
