"use client";

import { Product } from "@/domain/product/types/product";
import { Event } from "@/domain/event/types/event";
import { isProductSellable } from "@/domain/product/businessLogic";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import ProductAddToCart from "@/app/_components/product/ProductAddToCart";
import { isEventCompleted } from "@/domain/event/businessLogic";
import Banner from "@/app/_components/ui/Banner";
import Accordion from "@/app/_components/content/Accordion";
import EventTicketAccordionItem, {
  formatTicketTitle,
} from "@/app/_components/event/EventTicketAccordionItem";

interface EventTicketDisplayProps {
  products: Product[];
  event: Event;
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
    headline = "Tickets not available online";
    subtitle = "Online tickets SOLD OUT";
    content = (
      <Banner title={"Tickets are available at entrance"}>
        Online tickets are sold out, but you can still get the tickets for you
        and your friends when you arrive at the event.{" "}
        <strong>Cash only.</strong>
      </Banner>
    );
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
          className={"font-heading uppercase text-3xl text-neutral-400 mb-8"}
        >
          {singleProductAvailable
            ? "Tickets available now"
            : "Tickets not available online"}
        </div>

        {!singleProductAvailable && content}

        <div>
          {singleProduct.images?.[0] && (
            <ImageWithFallback
              src={singleProduct.images[0].src}
              alt={singleProduct.images[0].alt ?? ""}
              width={400}
              height={229}
              placeholder={singleProduct.images[0].placeholder}
            />
          )}
        </div>
        <h2 className={"text-2xl my-6"}>{singleProduct.name}</h2>
        {singleProductAvailable && <ProductAddToCart product={singleProduct} />}
      </div>
    );
  }

  // For multiple products - use accordion
  const accordionItems = products.map(product => ({
    title: formatTicketTitle(product),
    content: <EventTicketAccordionItem product={product} />,
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

      <Accordion
        items={accordionItems}
        allowMultiple={false}
        defaultOpenIndex={0}
        compact={true}
      />
    </div>
  );
}
