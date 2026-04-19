"use client";

import { Product } from "@/domain/product/types/product";
import { Event, EventType } from "@/domain/event/types/event";
import {
  getTicketQuantityForProduct,
  isProductSellable,
} from "@/domain/product/businessLogic";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { isEventCompleted } from "@/domain/event/businessLogic";
import Banner from "@/app/_components/ui/Banner";
import Accordion from "@/app/_components/content/Accordion";
import { formatPrice } from "@/lib/util/formatting";
import TicketIcon from "@/app/_components/icon/TicketIcon";
import Image from "next/image";
import EventUrgencyBar from "./EventUrgencyBar";

interface EventTicketDisplayProps {
  products: Product[];
  event: Event;
}

export function formatTicketTitle(product: Product, isHot?: boolean) {
  const ticketQuantity = getTicketQuantityForProduct(product);
  const quantitySuffix = `${ticketQuantity} ${ticketQuantity === 1 ? "person" : "people"}`;
  return (
    <div>
      <div className={"font-semibold flex gap-x-1.5 items-center"}>
        {product.name}
        {isHot && (
          <Image
            src="/images/flame.gif"
            alt="Hot"
            className="w-5 h-5 h"
            width={40}
            height={40}
            unoptimized
          />
        )}
      </div>
      <div className={"text-sm text-neutral-400 flex gap-x-1.5 items-center"}>
        <span className={"flex gap-x-1 opacity-65"}>
          {[...Array(ticketQuantity).keys()].map(i => (
            <TicketIcon key={`ticket-icon-${i}`} />
          ))}
        </span>
        <span>
          {quantitySuffix} - {formatPrice(product.price)}
        </span>
      </div>
    </div>
  );
}

function TicketPurchaseDisplay({
  productAvailable,
  product,
  content,
  showTicketQuantities = false,
}: {
  productAvailable: boolean | null;
  product: Product;
  content: React.ReactNode | null;
  showTicketQuantities: boolean;
}) {
  const ticketQuantity = getTicketQuantityForProduct(product);

  return (
    <div className={"flex flex-col items-center"}>
      {!productAvailable && content}

      <div>
        {product.images?.[0] && (
          <ImageWithFallback
            src={product.images[0].src}
            alt={product.images[0].alt ?? ""}
            width={400}
            height={229}
            placeholder={product.images[0].placeholder}
          />
        )}
      </div>
      <div className={"my-6 text-center"}>
        <h2 className={"text-2xl"}>{product.name}</h2>
        {showTicketQuantities && (
          <p className="text-neutral-600 text-sm">
            Includes tickets for {ticketQuantity}{" "}
            {ticketQuantity === 1 ? "person" : "people"}
          </p>
        )}
      </div>
      {productAvailable && <ProductAddToCart product={product} />}
    </div>
  );
}

export default function EventTicketDisplay({
  products,
  event,
}: EventTicketDisplayProps) {
  const isPastEvent = isEventCompleted(event);
  const hasProducts = products.length > 0;
  const hasMultipleProducts = products.length > 1;

  // Check if any product is available
  const availableProducts = products.filter(
    p => isProductSellable(p).isSellable
  );
  const hasAvailableProducts = availableProducts.length > 0;

  // For single product, use simplified display (backward compatible)
  const singleProduct = products.length === 1 ? products[0] : null;
  const singleProductAvailable =
    singleProduct && isProductSellable(singleProduct).isSellable;

  // Determine headline and subtitle for non-accordion cases
  let headline: string | null = null;
  let subtitle: string | null = null;
  let content: React.ReactNode = null;

  if (!event.tickets.shouldSellTickets) {
    headline = "FREE admission";
    subtitle = "No tickets required";
  } else if (!hasProducts) {
    if (isPastEvent) {
      headline = "Tickets no longer available";
      subtitle = "This event has concluded.";
    } else {
      headline = "Tickets coming soon";
      subtitle = "Tickets are not for sale yet";
    }
  } else if (!hasAvailableProducts) {
    // Mark tickets as sold out in Prismic to achieve this state
    headline = "Tickets not available online";
    subtitle = "Online tickets SOLD OUT";
    content = (
      <Banner title={"Tickets are available at entrance"}>
        Online tickets are sold out, but you can still get the tickets for you
        and your friends when you arrive at the event.{" "}
        <strong>Cash only.</strong>
      </Banner>
    );

    // Override headline for festival 2026 - TODO - remove
    if (event.type === EventType.Festival) {
      headline = "Ticket batch sold out";
      subtitle = "Next ticket batch coming soon";
      content = (
        <Banner title={"Ticket batch sold out"}>
          This ticket batch for Endemit 2026 is sold out. We will be releasing
          the next ticket batch soon. Stay tuned!
        </Banner>
      );
    }
  }

  // For free admission, past event, or no products - show simple message
  if (!event.tickets.shouldSellTickets || !hasProducts || isPastEvent) {
    return (
      <div className={"flex flex-col items-center text-neutral-200"}>
        <div
          className={"font-heading uppercase text-3xl text-neutral-400 mb-8"}
        >
          {headline}
        </div>
        {content}
        {event.promoImage && (
          <div>
            <ImageWithFallback
              src={event.promoImage.src}
              alt={event.promoImage.alt ?? ""}
              width={400}
              height={229}
              placeholder={event.promoImage.placeholder}
            />
          </div>
        )}
        <h2 className={"text-2xl my-6"}>{subtitle}</h2>
      </div>
    );
  }

  // For single product - use simplified display (backward compatible)
  if (!hasMultipleProducts && singleProduct) {
    return (
      <div className={"flex flex-col items-center text-neutral-200"}>
        <div
          className={"font-heading uppercase text-3xl text-neutral-400 mb-4"}
        >
          {singleProductAvailable
            ? "Tickets available now"
            : "Tickets not available online"}
        </div>
        {TicketPurchaseDisplay({
          product: singleProduct,
          productAvailable: singleProductAvailable,
          content,
          showTicketQuantities: false,
        })}
        {singleProductAvailable && event.date_start && (
          <div className="w-full max-w-sm mt-4">
            <EventUrgencyBar eventStartDate={new Date(event.date_start)} />
          </div>
        )}
      </div>
    );
  }

  // For multiple products - use accordion
  const middleIndex = Math.floor(products.length / 2);
  const accordionItems = products.map((product, index) => ({
    title: formatTicketTitle(product, index === middleIndex),
    content: TicketPurchaseDisplay({
      product,
      productAvailable: product && isProductSellable(product).isSellable,
      content,
      showTicketQuantities: true,
    }),
  }));

  return (
    <div className={"flex flex-col text-neutral-200"}>
      <div
        className={
          "font-heading uppercase text-3xl text-neutral-400 mb-4 text-center"
        }
      >
        {hasAvailableProducts
          ? "Tickets available now"
          : "Tickets not available online"}
      </div>

      {!hasAvailableProducts && content}

      {hasAvailableProducts && (
        <Accordion
          items={accordionItems}
          allowMultiple={false}
          compact={true}
          autoExpandIndexOnView={middleIndex}
          autoExpandDelay={500}
        />
      )}

      {hasAvailableProducts && event.date_start && (
        <div className="mt-2">
          <EventUrgencyBar eventStartDate={new Date(event.date_start)} />
        </div>
      )}
    </div>
  );
}
