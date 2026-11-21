import { Product } from "@/domain/product/types/product";
import { Event } from "@/domain/event/types/event";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import SeoSchema from "@/app/_components/seo/SeoSchema";
import { isProductSellable } from "@/domain/product/businessLogic";

type Props = {
  event: Event;
  products?: Product[];
};

export default function EventSeoMicrodata({ event, products = [] }: Props) {
  // Use the lowest-priced product still on sale for SEO (products should
  // already be sorted by price; sold-out types can be in the list too)
  const lowestPriceProduct =
    products.find(product => isProductSellable(product).isSellable) ??
    products[0] ??
    null;

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: event.name,
    ...(event.date_start && { startDate: event.date_start.toISOString() }),
    ...(event.date_end && { endDate: event.date_end.toISOString() }),
    image: event.promoImage?.src || event.coverImage?.src,
    url: `${PUBLIC_BASE_WEB_URL}/events/${event.uid}`,
    ...(event.description && { description: event.description }),
    ...(event.venue && {
      location: {
        "@type": "MusicVenue",
        name: event.venue.name,
        ...(event.venue.address && {
          address: {
            "@type": "PostalAddress",
            streetAddress: event.venue.address,
          },
        }),
        ...(event.venue.coordinates && {
          geo: {
            "@type": "GeoCoordinates",
            latitude: event.venue.coordinates.latitude,
            longitude: event.venue.coordinates.longitude,
          },
        }),
      },
    }),
    performer: event.artists
      .filter(artist => artist?.name)
      .map(artist => ({
        "@type": "Person",
        name: artist.name,
        jobTitle: "DJ",
      })),
    ...(lowestPriceProduct &&
      lowestPriceProduct.price != null &&
      event.tickets.available && {
        offers: {
          "@type": "Offer",
          url: `${PUBLIC_BASE_WEB_URL}/events/${event.uid}`,
          price: lowestPriceProduct.price.toString(),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
      }),
  };

  return <SeoSchema>{eventSchema}</SeoSchema>;
}
