import { Venue } from "@/domain/venue/types/venue";
import { VenueDocument } from "@/prismicio-types";
import { asLink } from "@prismicio/client";
import { getBlurDataURL } from "@/lib/util/util";
import { pickLocalized } from "@/domain/cms/pickLocalized";
import type { AppLocale } from "@/i18n/routing";

export const transformVenueObject = async (
  venue: VenueDocument,
  locale: AppLocale = "sl"
) => {
  return {
    id: venue.id,
    uid: venue.uid,
    name: pickLocalized(venue.data, "name", locale),
    description: pickLocalized(venue.data, "description", locale),
    logo: venue.data.venue_logo
      ? {
          src: venue.data.venue_logo.url,
          alt: venue.data.venue_logo.alt,
          placeholder: venue.data.venue_logo.url
            ? await getBlurDataURL(venue.data.venue_logo.url)
            : null,
        }
      : null,
    image: venue.data.image
      ? {
          src: venue.data.image.url,
          alt: venue.data.image.alt,
          placeholder: venue.data.image.url
            ? await getBlurDataURL(venue.data.image.url)
            : null,
        }
      : null,
    address: venue.data?.address ?? null,
    coordinates: venue.data.coordinates ?? null,
    mapUrl: asLink(venue.data.map_location_url) ?? null,
    updatedAt: new Date(venue.last_publication_date),
    showOnVenuePage: venue.data.show_in_venues,
    meta: {
      title: pickLocalized(venue.data, "meta_title", locale),
      description: pickLocalized(venue.data, "meta_description", locale),
      image: venue.data.meta_image?.url || null,
    },
  } as Venue;
};
