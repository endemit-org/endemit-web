import { Product } from "@/domain/product/types/product";
import { Event } from "@/domain/event/types/event";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";
import SeoSchema from "@/app/_components/seo/SeoSchema";

type Props = {
  event: Event;
  product?: Product | null;
};

export default function EventSeoMicrodata({ event, product }: Props) {
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
    performer: event.artists.map(artist => ({
      "@type": "Person",
      name: artist.name,
      jobTitle: "DJ",
    })),
    ...(product &&
      event.tickets.available && {
        offers: {
          "@type": "Offer",
          url: `${PUBLIC_BASE_WEB_URL}/events/${event.uid}`,
          price: product.price.toString(),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
      }),
  };

  return <SeoSchema>{eventSchema}</SeoSchema>;
}
