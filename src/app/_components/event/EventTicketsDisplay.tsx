"use client";

import { Product } from "@/domain/product/types/product";
import { Event } from "@/domain/event/types/event";
import { isProductSellable } from "@/domain/product/businessLogic";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { isEventCompleted } from "@/domain/event/businessLogic";
import Banner from "@/app/_components/ui/Banner";

export default function EventTicketDisplay({
  product,
  event,
}: {
  product?: Product | null;
  event: Event;
}) {
  const productAvailable = product && !isProductSellable(product).isSellable;
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
        <Banner title={"Tickets are available at entrance"}>
          Online tickets are sold out, but you can still get the tickets for you
          and your friends when you arrive at the event.{" "}
          <strong>Cash only.</strong>
        </Banner>
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
