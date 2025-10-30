import { Venue } from "@/domain/venue/types/venue";
import { VenueDocument } from "@/prismicio-types";
import { asLink } from "@prismicio/client";
import { getBlurDataURL } from "@/lib/util/util";

export const transformVenueObject = async (venue: VenueDocument) => {
  return {
    id: venue.id,
    uid: venue.uid,
    name: venue.data.name,
    description: venue.data.description,
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
      title: venue.data.meta_title,
      description: venue.data.meta_description,
      image: venue.data.meta_image?.url || null,
    },
  } as Venue;
};
