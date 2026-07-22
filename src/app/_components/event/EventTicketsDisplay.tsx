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
import { useTranslations } from "next-intl";

interface EventTicketDisplayProps {
  products: Product[];
  event: Event;
}

export function formatTicketTitle(
  product: Product,
  isHot?: boolean,
  hotAlt: string = "Hot",
  personCountLabel?: string
) {
  const ticketQuantity = getTicketQuantityForProduct(product);
  const quantitySuffix =
    personCountLabel ??
    `${ticketQuantity} ${ticketQuantity === 1 ? "person" : "people"}`;
  return (
    <div>
      <div className={"font-semibold flex gap-x-1.5 items-center"}>
        {product.name}
        {isHot && (
          <Image
            src="/images/transparent.gif"
            alt={hotAlt}
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
  includesTicketsLabel,
}: {
  productAvailable: boolean | null;
  product: Product;
  content: React.ReactNode | null;
  showTicketQuantities: boolean;
  includesTicketsLabel?: string;
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
            {includesTicketsLabel ??
              `Includes tickets for ${ticketQuantity} ${ticketQuantity === 1 ? "person" : "people"}`}
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
  const t = useTranslations("events");
  // Defensive: never crash the whole page if an event somehow arrives undefined.
  if (!event) return null;
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
    headline = t("ticketsDisplay.freeAdmission");
    subtitle = t("ticketsDisplay.noTicketsRequired");
  } else if (!hasProducts) {
    if (isPastEvent) {
      headline = t("ticketsDisplay.noLongerAvailable");
      subtitle = t("ticketsDisplay.eventConcluded");
    } else {
      headline = t("ticketsDisplay.comingSoon");
      subtitle = t("ticketsDisplay.notForSaleYet");
    }
  } else if (!hasAvailableProducts) {
    // Mark tickets as sold out in Prismic to achieve this state
    headline = t("ticketsDisplay.notAvailableOnline");
    subtitle = t("ticketsDisplay.onlineSoldOut");
    content = (
      <Banner title={t("ticketsDisplay.availableAtEntrance")}>
        {t.rich("ticketsDisplay.soldOutBanner", {
          strong: chunks => <strong>{chunks}</strong>,
        })}
      </Banner>
    );

    // Override headline for festival 2026 - TODO - remove
    if (event.type === EventType.Festival) {
      headline = t("ticketsDisplay.batchSoldOut");
      subtitle = t("ticketsDisplay.batchComingSoon");
      content = (
        <Banner title={t("ticketsDisplay.batchSoldOut")}>
          {t("ticketsDisplay.batchSoldOutBanner")}
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
            ? t("ticketsDisplay.availableNow")
            : t("ticketsDisplay.notAvailableOnline")}
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
    title: formatTicketTitle(
      product,
      index === middleIndex,
      t("ticketsDisplay.hot"),
      t("ticketsDisplay.personCount", {
        count: getTicketQuantityForProduct(product),
      })
    ),
    content: TicketPurchaseDisplay({
      product,
      productAvailable: product && isProductSellable(product).isSellable,
      content,
      showTicketQuantities: true,
      includesTicketsLabel: t("ticketsDisplay.includesTickets", {
        count: getTicketQuantityForProduct(product),
      }),
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
          ? t("ticketsDisplay.availableNow")
          : t("ticketsDisplay.notAvailableOnline")}
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
